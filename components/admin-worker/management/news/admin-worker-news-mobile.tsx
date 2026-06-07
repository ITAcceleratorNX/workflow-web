"use client";

import { useCallback, useRef } from "react";
import { AdminWorkerNewsManagementScreen } from "@/components/admin-worker/news/admin-worker-news-management-screen";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

export function AdminWorkerNewsMobile() {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  const handleRefresh = useCallback(async () => {
    await refreshRef.current?.();
  }, []);

  return (
    <AdminWorkerManagementMobileLayout title="Управление новостями" onRefresh={handleRefresh}>
      <AdminWorkerNewsManagementScreen onRegisterRefresh={handleRegisterRefresh} />
    </AdminWorkerManagementMobileLayout>
  );
}
