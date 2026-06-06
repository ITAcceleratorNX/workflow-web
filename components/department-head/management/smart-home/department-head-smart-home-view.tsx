"use client";

import { useDepartmentHeadManagementCrudPage } from "@/hooks/use-department-head-management-crud-page";
import { DepartmentHeadSmartHomeMobile } from "./department-head-smart-home-mobile";

export function DepartmentHeadSmartHomeView() {
  const { isDesktop } = useDepartmentHeadManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <DepartmentHeadSmartHomeMobile />;
}
