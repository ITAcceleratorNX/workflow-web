"use client";

import { use } from "react";
import { SupportChatView } from "@/components/help";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function SupportChatPage({ params }: PageProps) {
  const { id } = use(params);
  const ticketId = parseInt(id, 10);

  return <SupportChatView ticketId={ticketId} mode="client" />;
}
