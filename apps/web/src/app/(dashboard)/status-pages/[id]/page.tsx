import StatusPageBuilderClient from "./client";

export function generateStaticParams() {
  return [{ id: "sp1" }];
}

export default function StatusPageBuilderPage() {
  return <StatusPageBuilderClient />;
}
