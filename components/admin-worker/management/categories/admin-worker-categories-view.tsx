"use client";

import { useAdminWorkerManagementCrudPage } from "@/hooks/use-admin-worker-management-crud-page";
import { AdminWorkerCategoriesMobile } from "./admin-worker-categories-mobile";

export function AdminWorkerCategoriesView() {
  const { isDesktop } = useAdminWorkerManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <AdminWorkerCategoriesMobile />;
}
