"use client";

import { useCallback, useRef } from "react";
import { AdminWorkerNewsManagementScreen } from "@/components/admin-worker/news/admin-worker-news-management-screen";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";

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
      <AdminWorkerNewsManagementScreen onRegisterRefresh={handleRegisterRefresh} />
    </DesktopManagementPage>
  );
}
