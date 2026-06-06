"use client";

import { useAdminWorkerManagementCrudPage } from "@/hooks/use-admin-worker-management-crud-page";
import { AdminWorkerCompaniesMobile } from "./admin-worker-companies-mobile";

export function AdminWorkerCompaniesView() {
  const { isDesktop } = useAdminWorkerManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <AdminWorkerCompaniesMobile />;
}
