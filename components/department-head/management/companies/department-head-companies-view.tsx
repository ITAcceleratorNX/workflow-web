"use client";

import { useDepartmentHeadManagementCrudPage } from "@/hooks/use-department-head-management-crud-page";
import { DepartmentHeadCompaniesMobile } from "./department-head-companies-mobile";

export function DepartmentHeadCompaniesView() {
  const { isDesktop } = useDepartmentHeadManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <DepartmentHeadCompaniesMobile />;
}
