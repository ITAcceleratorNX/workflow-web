"use client";

import React from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import { AdminManagerMessagesDesktop } from "@/components/layout/AdminManagerMessagesDesktop";
import { AdminSupportTicketsList } from "@/components/help";

export default function ManagerMessagesPage() {
  const { user, role } = useAuthStore();
  const isDesktop = useIsDesktop();

  if (!user || role !== "manager") {
    return null;
  }

  if (isDesktop) {
    return <AdminManagerMessagesDesktop canRespond={false} />;
  }

  return <AdminSupportTicketsList canRespond={false} basePath="/manager/messages" />;
}
