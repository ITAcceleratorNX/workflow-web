"use client";

import { useCallback, useRef } from "react";
import { CategoryManagementScreen } from "@/components/categories/category-management-screen";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";

export function AdminWorkerCategoriesDesktop() {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  return (
    <DesktopManagementPage
      title="Категории и подкатегории"
      backHref={ADMIN_WORKER_MANAGEMENT_BACK_HREF}
    >
      <CategoryManagementScreen variant="admin-worker" onRegisterRefresh={handleRegisterRefresh} />
    </DesktopManagementPage>
  );
}
