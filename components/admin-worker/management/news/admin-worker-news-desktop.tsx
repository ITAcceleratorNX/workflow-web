"use client";

import { useCallback, useRef } from "react";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";
import { AdminWorkerNewsSections } from "./admin-worker-news-sections";

export function AdminWorkerNewsDesktop() {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  return (
    <DesktopManagementPage
      title="Управление новостями"
      backHref={ADMIN_WORKER_MANAGEMENT_BACK_HREF}
    >
      <AdminWorkerNewsSections layout="desktop" onRegisterRefresh={handleRegisterRefresh} />
    </DesktopManagementPage>
  );
}
