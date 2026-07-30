import DetectPanel from "../components/DetectPanel";

interface DetectPageProps {
  onDetected: () => void;
}

export default function DetectPage({ onDetected }: DetectPageProps) {
  return <DetectPanel onDetected={onDetected} />;
}
