"use client";

import { useCallback, useRef } from "react";
import { AdminWorkerUsersScreen } from "@/components/admin-worker/admin-worker-users-screen";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

/** Mobile users — parity с workflow-mobile admin-worker/users.tsx. */
export function AdminWorkerUsersMobile() {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  const handleRefresh = useCallback(async () => {
    await refreshRef.current?.();
  }, []);

  return (
    <AdminWorkerManagementMobileLayout title="Пользователи" onRefresh={handleRefresh}>
      <AdminWorkerUsersScreen onRegisterRefresh={handleRegisterRefresh} />
    </AdminWorkerManagementMobileLayout>
  );
}
