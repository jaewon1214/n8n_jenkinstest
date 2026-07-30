import LogTable from "../components/LogTable";

interface LogsPageProps {
  refreshKey: number;
}

export default function LogsPage({ refreshKey }: LogsPageProps) {
  return <LogTable refreshKey={refreshKey} />;
}
