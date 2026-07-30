import { useState } from "react";
import { ConfigProvider, Layout, Tabs, theme } from "antd";
import koKR from "antd/locale/ko_KR";
import {
  CarOutlined,
  HistoryOutlined,
  ScanOutlined,
} from "@ant-design/icons";
import DetectPage from "./pages/DetectPage";
import LogsPage from "./pages/LogsPage";

const { Header, Content, Footer } = Layout;

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#0f766e",
          borderRadius: 8,
          fontFamily:
            '"Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }}
    >
      <Layout style={{ minHeight: "100vh", background: "#f4f7f6" }}>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#0f766e",
            paddingInline: 24,
          }}
        >
          <CarOutlined style={{ fontSize: 22, color: "#fff" }} />
          <span
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Read Plate Auto
          </span>
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
            번호판 인식 대시보드
          </span>
        </Header>

        <Content
          style={{
            padding: "24px 16px",
            maxWidth: 1100,
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 1px 3px rgba(15, 118, 110, 0.08)",
            }}
          >
            <Tabs
              defaultActiveKey="detect"
              items={[
                {
                  key: "detect",
                  label: (
                    <span>
                      <ScanOutlined /> 인식
                    </span>
                  ),
                  children: (
                    <DetectPage onDetected={() => setRefreshKey((k) => k + 1)} />
                  ),
                },
                {
                  key: "logs",
                  label: (
                    <span>
                      <HistoryOutlined /> 이력
                    </span>
                  ),
                  children: <LogsPage refreshKey={refreshKey} />,
                },
              ]}
            />
          </div>
        </Content>

        <Footer
          style={{
            textAlign: "center",
            color: "#64748b",
            background: "transparent",
          }}
        >
          YOLO 카메라 모니터링은 `main.py` · OCR은 n8n webhook · 저장은 DuckDB
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}
