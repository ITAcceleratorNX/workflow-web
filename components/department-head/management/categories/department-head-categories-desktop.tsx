"use client";

import { useCallback, useRef } from "react";
import { CategoryManagementScreen } from "@/components/categories/category-management-screen";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF } from "@/hooks/use-department-head-management-crud-page";

export function DepartmentHeadCategoriesDesktop() {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  return (
    <DesktopManagementPage
      title="Категории и подкатегории"
      backHref={DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF}
    >
      <CategoryManagementScreen
        variant="department-head"
        onRegisterRefresh={handleRegisterRefresh}
      />
    </DesktopManagementPage>
  );
}
