import { useCallback, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Empty,
  Image,
  Row,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import {
  InboxOutlined,
  ScanOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { detectPlate, imageSrc } from "../api";
import type { DetectResult } from "../types";

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface DetectPanelProps {
  onDetected: () => void;
}

export default function DetectPanel({ onDetected }: DetectPanelProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setFileList([]);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  }, []);

  const handleDetect = async () => {
    const raw = fileList[0]?.originFileObj;
    if (!raw) {
      message.warning("이미지를 먼저 업로드하세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await detectPlate(raw);
      setResult(data);
      message.success(`번호판 인식: ${data.plate}`);
      onDetected();
    } catch (err: unknown) {
      const detail =
        axiosDetail(err) ??
        (err instanceof Error ? err.message : "인식 요청에 실패했습니다.");
      setError(detail);
      message.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={4} style={{ marginBottom: 4 }}>
          번호판 인식
        </Title>
        <Text type="secondary">
          차량 이미지를 업로드한 뒤 인식 버튼을 누르면 n8n OCR로 번호판을 추출하고
          DuckDB에 저장합니다.
        </Text>
      </div>

      <Dragger
        accept="image/*"
        maxCount={1}
        fileList={fileList}
        beforeUpload={(file) => {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          setResult(null);
          setError(null);
          setFileList([
            {
              uid: file.uid,
              name: file.name,
              status: "done",
              originFileObj: file,
            },
          ]);
          return false;
        }}
        onRemove={() => {
          reset();
          return true;
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">클릭하거나 이미지를 이 영역으로 드래그</p>
        <p className="ant-upload-hint">JPG, PNG 등 이미지 파일 1개</p>
      </Dragger>

      <Space wrap>
        <Button
          type="primary"
          icon={<ScanOutlined />}
          loading={loading}
          disabled={fileList.length === 0}
          onClick={handleDetect}
        >
          번호판 인식
        </Button>
        <Button icon={<ClearOutlined />} onClick={reset} disabled={loading}>
          초기화
        </Button>
      </Space>

      {error && <Alert type="error" showIcon message={error} />}

      {result && (
        <Alert
          type="success"
          showIcon
          message={`인식 결과: ${result.plate}`}
          description={`저장 시각: ${new Date(result.created_at).toLocaleString("ko-KR")}`}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="업로드 미리보기"
              style={{ maxHeight: 320, objectFit: "contain" }}
            />
          ) : (
            <Empty description="미리보기 없음" />
          )}
        </Col>
        <Col xs={24} md={12}>
          {result ? (
            <Image
              src={imageSrc(result.image_url)}
              alt="저장된 이미지"
              style={{ maxHeight: 320, objectFit: "contain" }}
            />
          ) : null}
        </Col>
      </Row>
    </Space>
  );
}

function axiosDetail(err: unknown): string | null {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: { data?: { detail?: string } } }).response?.data
      ?.detail === "string"
  ) {
    return (err as { response: { data: { detail: string } } }).response.data
      .detail;
  }
  return null;
}
