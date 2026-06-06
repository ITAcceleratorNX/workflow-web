"use client";

import { useDepartmentHeadManagementCrudPage } from "@/hooks/use-department-head-management-crud-page";
import { DepartmentHeadUsersMobile } from "./department-head-users-mobile";

export function DepartmentHeadUsersView() {
  const { isDesktop } = useDepartmentHeadManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <DepartmentHeadUsersMobile />;
}
