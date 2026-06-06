"use client";

import { AdminManagerMessagesDesktop } from "@/components/layout/AdminManagerMessagesDesktop";
import { useAdminWorkerMessages } from "@/hooks/use-admin-worker-messages";
import { AdminWorkerMessagesMobile } from "./admin-worker-messages-mobile";

export function AdminWorkerMessagesView() {
  const { isDesktop } = useAdminWorkerMessages();

  if (isDesktop) {
    return <AdminManagerMessagesDesktop canRespond={true} />;
  }

  return <AdminWorkerMessagesMobile />;
}
