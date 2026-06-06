"use client";

import { useParams } from "next/navigation";
import { ClientTaskDetailMobileView } from "@/components/client/tasks";

export default function ClientTaskDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  if (!Number.isFinite(id)) return null;
  return <ClientTaskDetailMobileView taskId={id} />;
}
