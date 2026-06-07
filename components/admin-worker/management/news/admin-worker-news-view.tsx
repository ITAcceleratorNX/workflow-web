"use client";

import { useAdminWorkerManagementCrudPage } from "@/hooks/use-admin-worker-management-crud-page";
import { AdminWorkerNewsMobile } from "./admin-worker-news-mobile";

export function AdminWorkerNewsView() {
  const { isDesktop } = useAdminWorkerManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <AdminWorkerNewsMobile />;
}
