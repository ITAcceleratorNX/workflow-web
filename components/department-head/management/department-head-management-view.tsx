"use client";

import { useDepartmentHeadManagementCrudPage } from "@/hooks/use-department-head-management-crud-page";
import { DepartmentHeadManagementHub } from "./department-head-management-hub";

export function DepartmentHeadManagementView() {
  const { isDesktop } = useDepartmentHeadManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <DepartmentHeadManagementHub />;
}
