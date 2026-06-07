"use client";

import { useAdminWorkerManagementCrudPage } from "@/hooks/use-admin-worker-management-crud-page";
import { AdminWorkerLocationCatalogMobile } from "./admin-worker-location-catalog-mobile";

export function AdminWorkerLocationCatalogView() {
  const { isDesktop } = useAdminWorkerManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <AdminWorkerLocationCatalogMobile />;
}
