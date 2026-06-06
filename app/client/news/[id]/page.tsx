"use client";

import { use } from "react";
import { ClientNewsDetailView } from "@/components/client/news";

export default function ClientNewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ClientNewsDetailView newsId={id} />;
}
