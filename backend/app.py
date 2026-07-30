"""번호판 인식 API — n8n OCR + DuckDB 저장."""

from __future__ import annotations

import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import duckdb
import requests
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

# =========================
# 설정
# =========================
BASE_DIR = Path(__file__).resolve().parent
WEBHOOK_URL = os.getenv(
    "WEBHOOK_URL", "http://host.docker.internal:5678/webhook/plate_detect"
)
DUCKDB_PATH = Path(os.getenv("DUCKDB_PATH", str(BASE_DIR / "db" / "vehicle.duckdb")))
IMAGE_SAVE_DIR = Path(os.getenv("IMAGE_SAVE_DIR", str(BASE_DIR / "plates")))

IMAGE_SAVE_DIR.mkdir(parents=True, exist_ok=True)
DUCKDB_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_connection() -> duckdb.DuckDBPyConnection:
    con = duckdb.connect(str(DUCKDB_PATH))
    con.execute(
        """
        CREATE TABLE IF NOT EXISTS vehicle_logs (
            plate VARCHAR,
            image_path VARCHAR,
            created_at TIMESTAMP
        )
        """
    )
    return con


class DetectResponse(BaseModel):
    plate: str
    image_path: str
    image_url: str
    created_at: str


class LogItem(BaseModel):
    plate: str
    image_path: str
    image_url: str
    created_at: str


app = FastAPI(title="Read Plate Auto API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_image_url(image_path: str) -> str:
    name = Path(image_path).name
    return f"/api/images/{name}"


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/detect", response_model=DetectResponse)
async def detect_plate(file: UploadFile = File(...)) -> DetectResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드할 수 있습니다.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="빈 파일입니다.")

    filename = file.filename or "upload.jpg"

    try:
        response = requests.post(
            WEBHOOK_URL,
            files={"file": (filename, image_bytes, file.content_type or "image/jpeg")},
            timeout=30,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"n8n 요청 실패: {exc}") from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"n8n 오류 ({response.status_code}): {response.text[:200]}",
        )

    try:
        result: dict[str, Any] = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="n8n 응답 JSON 파싱 실패") from exc

    if isinstance(result, list):
        result = result[0] if result else {}

    plate = result.get("plate", "UNKNOWN")
    created_at = datetime.now(UTC)
    timestamp = int(created_at.timestamp())
    saved_name = f"{plate}_{timestamp}.jpg"
    saved_path = IMAGE_SAVE_DIR / saved_name

    saved_path.write_bytes(image_bytes)
    relative_path = f"./plates/{saved_name}"

    con = get_connection()
    try:
        con.execute(
            "INSERT INTO vehicle_logs (plate, image_path, created_at) VALUES (?, ?, ?)",
            (plate, relative_path, created_at.replace(tzinfo=None)),
        )
    finally:
        con.close()

    return DetectResponse(
        plate=plate,
        image_path=relative_path,
        image_url=to_image_url(relative_path),
        created_at=created_at.isoformat(),
    )


@app.get("/api/logs", response_model=list[LogItem])
def list_logs(limit: int = 100) -> list[LogItem]:
    limit = max(1, min(limit, 500))
    con = get_connection()
    try:
        rows = con.execute(
            """
            SELECT plate, image_path, created_at
            FROM vehicle_logs
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    finally:
        con.close()

    items: list[LogItem] = []
    for plate, image_path, created_at in rows:
        created = (
            created_at.isoformat()
            if hasattr(created_at, "isoformat")
            else str(created_at)
        )
        items.append(
            LogItem(
                plate=plate,
                image_path=image_path,
                image_url=to_image_url(image_path),
                created_at=created,
            )
        )
    return items


@app.get("/api/images/{filename}")
def get_image(filename: str) -> FileResponse:
    safe_name = Path(filename).name
    path = IMAGE_SAVE_DIR / safe_name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")
    return FileResponse(path)
