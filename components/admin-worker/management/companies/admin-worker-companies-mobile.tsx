"use client";

import CompaniesManagement from "@/components/CompaniesManagement";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

export function AdminWorkerCompaniesMobile() {
  return (
    <AdminWorkerManagementMobileLayout title="Компании">
      <CompaniesManagement variant="admin-worker" />
    </AdminWorkerManagementMobileLayout>
  );
}
