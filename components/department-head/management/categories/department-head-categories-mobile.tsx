"use client";

import { ManagementCategoriesContent } from "@/components/management/ManagementCategoriesContent";
import { DepartmentHeadManagementMobileLayout } from "../department-head-management-mobile-layout";

export function DepartmentHeadCategoriesMobile() {
  return (
    <DepartmentHeadManagementMobileLayout title="Категории и подкатегории">
      <ManagementCategoriesContent />
    </DepartmentHeadManagementMobileLayout>
  );
}
