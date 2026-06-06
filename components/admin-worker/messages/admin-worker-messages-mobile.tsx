"use client";

import { AdminSupportTicketsList } from "@/components/help";

export function AdminWorkerMessagesMobile() {
  return <AdminSupportTicketsList canRespond basePath="/admin-worker/messages" />;
}
