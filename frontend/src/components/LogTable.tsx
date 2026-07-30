import { useCallback, useEffect, useState } from "react";
import { Button, Image, Space, Table, Typography, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { fetchLogs, imageSrc } from "../api";
import type { LogItem } from "../types";

const { Title, Text } = Typography;

interface LogTableProps {
  refreshKey: number;
}

export default function LogTable({ refreshKey }: LogTableProps) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLogs();
      setLogs(data);
    } catch {
      message.error("이력을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const columns: ColumnsType<LogItem> = [
    {
      title: "번호판",
      dataIndex: "plate",
      key: "plate",
      width: 160,
      render: (plate: string) => (
        <Text strong style={{ fontSize: 16, letterSpacing: 1 }}>
          {plate}
        </Text>
      ),
    },
    {
      title: "이미지",
      dataIndex: "image_url",
      key: "image",
      width: 120,
      render: (url: string) => (
        <Image
          src={imageSrc(url)}
          width={72}
          height={48}
          style={{ objectFit: "cover", borderRadius: 4 }}
          fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='48'%3E%3Crect fill='%23f0f0f0' width='72' height='48'/%3E%3C/svg%3E"
        />
      ),
    },
    {
      title: "경로",
      dataIndex: "image_path",
      key: "path",
      ellipsis: true,
    },
    {
      title: "인식 시각",
      dataIndex: "created_at",
      key: "created_at",
      width: 200,
      render: (value: string) =>
        dayjs(value).isValid()
          ? dayjs(value).format("YYYY-MM-DD HH:mm:ss")
          : value,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            인식 이력
          </Title>
          <Text type="secondary">DuckDB `vehicle_logs` 최근 기록</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void load()}
          loading={loading}
        >
          새로고침
        </Button>
      </div>

      <Table
        rowKey={(row) => `${row.plate}-${row.created_at}-${row.image_path}`}
        columns={columns}
        dataSource={logs}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 640 }}
      />
    </Space>
  );
}
