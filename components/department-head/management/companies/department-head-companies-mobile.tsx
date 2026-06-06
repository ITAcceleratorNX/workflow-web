"use client";

import CompaniesManagement from "@/components/CompaniesManagement";
import { DepartmentHeadManagementMobileLayout } from "../department-head-management-mobile-layout";

export function DepartmentHeadCompaniesMobile() {
  return (
    <DepartmentHeadManagementMobileLayout title="Компании">
      <CompaniesManagement variant="department-head" />
    </DepartmentHeadManagementMobileLayout>
  );
}
