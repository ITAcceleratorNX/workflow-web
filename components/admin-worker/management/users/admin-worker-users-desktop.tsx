"use client";

import { useCallback, useRef } from "react";
import { AdminWorkerUsersScreen } from "@/components/admin-worker/admin-worker-users-screen";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";

export function AdminWorkerUsersDesktop() {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  return (
    <DesktopManagementPage title="Пользователи" backHref={ADMIN_WORKER_MANAGEMENT_BACK_HREF}>
      <AdminWorkerUsersScreen onRegisterRefresh={handleRegisterRefresh} />
    </DesktopManagementPage>
  );
}
