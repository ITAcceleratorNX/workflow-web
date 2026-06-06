"use client";

import { useAdminWorkerManagementCrudPage } from "@/hooks/use-admin-worker-management-crud-page";
import { AdminWorkerOfficesMobile } from "./admin-worker-offices-mobile";

interface AdminWorkerOfficesViewProps {
  title?: string;
}

export function AdminWorkerOfficesView({ title = "Офисы" }: AdminWorkerOfficesViewProps) {
  const { isDesktop } = useAdminWorkerManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <AdminWorkerOfficesMobile title={title} />;
}
