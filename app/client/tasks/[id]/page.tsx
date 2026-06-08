"use client";

import { useParams } from "next/navigation";
import { ClientTaskDetailView } from "@/components/client/tasks";

export default function ClientTaskDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  if (!Number.isFinite(id)) return null;
  return <ClientTaskDetailView taskId={id} />;
}
