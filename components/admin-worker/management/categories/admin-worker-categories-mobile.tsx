"use client";

import { ManagementCategoriesContent } from "@/components/management/ManagementCategoriesContent";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

export function AdminWorkerCategoriesMobile() {
  return (
    <AdminWorkerManagementMobileLayout title="Категории и подкатегории">
      <ManagementCategoriesContent />
    </AdminWorkerManagementMobileLayout>
  );
}
