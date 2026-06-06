"use client";

import { useAdminWorkerManagementCrudPage } from "@/hooks/use-admin-worker-management-crud-page";
import { AdminWorkerSmartHomeMobile } from "./admin-worker-smart-home-mobile";

export function AdminWorkerSmartHomeView() {
  const { isDesktop } = useAdminWorkerManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <AdminWorkerSmartHomeMobile />;
}
