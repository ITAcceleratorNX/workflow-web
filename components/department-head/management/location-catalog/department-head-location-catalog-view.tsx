"use client";

import { useDepartmentHeadManagementCrudPage } from "@/hooks/use-department-head-management-crud-page";
import { DepartmentHeadLocationCatalogMobile } from "./department-head-location-catalog-mobile";

export function DepartmentHeadLocationCatalogView() {
  const { isDesktop } = useDepartmentHeadManagementCrudPage();

  if (isDesktop) {
    return null;
  }

  return <DepartmentHeadLocationCatalogMobile />;
}
