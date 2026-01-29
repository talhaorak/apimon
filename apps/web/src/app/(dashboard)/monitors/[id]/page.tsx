import MonitorDetailClient from "./client";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function MonitorDetailPage() {
  return <MonitorDetailClient />;
}
