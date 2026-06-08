"use client";

import { useCallback, useRef } from "react";
import { AdminOfficeManagementScreen } from "@/components/offices/admin-office-management-screen";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";

type AdminWorkerOfficesDesktopProps = {
  title?: string;
};

export function AdminWorkerOfficesDesktop({
  title = "Управление офисом",
}: AdminWorkerOfficesDesktopProps) {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  return (
    <DesktopManagementPage title={title} backHref={ADMIN_WORKER_MANAGEMENT_BACK_HREF}>
      <AdminOfficeManagementScreen onRegisterRefresh={handleRegisterRefresh} />
    </DesktopManagementPage>
  );
}
