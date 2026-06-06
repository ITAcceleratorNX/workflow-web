"use client";

import { useDepartmentHeadManagementCrudPage } from "@/hooks/use-department-head-management-crud-page";
import { DepartmentHeadCategoriesMobile } from "./department-head-categories-mobile";

export function DepartmentHeadCategoriesView() {
  const { isDesktop } = useDepartmentHeadManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <DepartmentHeadCategoriesMobile />;
}
