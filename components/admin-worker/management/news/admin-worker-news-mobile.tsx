"use client";

import { useCallback, useRef } from "react";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";
import { AdminWorkerNewsSections } from "./admin-worker-news-sections";

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
      <AdminWorkerNewsSections layout="mobile" onRegisterRefresh={handleRegisterRefresh} />
    </AdminWorkerManagementMobileLayout>
  );
}
