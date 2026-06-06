"use client";

import { useDepartmentHeadManagementCrudPage } from "@/hooks/use-department-head-management-crud-page";
import { DepartmentHeadOfficeMobile } from "./department-head-office-mobile";

export function DepartmentHeadOfficeView() {
  const { isDesktop } = useDepartmentHeadManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <DepartmentHeadOfficeMobile />;
}
