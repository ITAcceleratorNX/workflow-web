"use client";

import { useCallback, useRef } from "react";
import { AdminOfficeManagementScreen } from "@/components/offices/admin-office-management-screen";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

interface AdminWorkerOfficesMobileProps {
  title: string;
}

/** Управление офисом — parity с workflow-mobile admin-worker/office.tsx */
export function AdminWorkerOfficesMobile({ title }: AdminWorkerOfficesMobileProps) {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  const handleRefresh = useCallback(async () => {
    await refreshRef.current?.();
  }, []);

  return (
    <AdminWorkerManagementMobileLayout title={title} onRefresh={handleRefresh}>
      <AdminOfficeManagementScreen onRegisterRefresh={handleRegisterRefresh} />
    </AdminWorkerManagementMobileLayout>
  );
}
