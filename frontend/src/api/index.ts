import axios from "axios";
import type { DetectResult, LogItem } from "../types";

const client = axios.create({
  baseURL: "/api",
  timeout: 60_000,
});

export async function detectPlate(file: File): Promise<DetectResult> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await client.post<DetectResult>("/detect", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchLogs(limit = 100): Promise<LogItem[]> {
  const { data } = await client.get<LogItem[]>("/logs", { params: { limit } });
  return data;
}

export function imageSrc(url: string): string {
  if (
    url.startsWith("http") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  return url.startsWith("/") ? url : `/${url}`;
}
