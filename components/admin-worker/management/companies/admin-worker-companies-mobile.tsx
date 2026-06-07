"use client";

import { useCallback, useRef, useState } from "react";
import { CompaniesManagementScreen } from "@/components/companies/companies-management-screen";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

export function AdminWorkerCompaniesMobile() {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const [headerSlot, setHeaderSlot] = useState<React.ReactNode>(null);

  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  const handleRefresh = useCallback(async () => {
    await refreshRef.current?.();
  }, []);

  return (
    <AdminWorkerManagementMobileLayout
      title="Компании"
      onRefresh={handleRefresh}
      rightSlot={headerSlot}
      inlineTitle
    >
      <CompaniesManagementScreen
        variant="admin-worker"
        onRegisterRefresh={handleRegisterRefresh}
        onRegisterHeaderSlot={setHeaderSlot}
      />
    </AdminWorkerManagementMobileLayout>
  );
}
