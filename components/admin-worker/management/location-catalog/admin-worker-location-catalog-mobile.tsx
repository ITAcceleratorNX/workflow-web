"use client";

import { useCallback, useRef, useState } from "react";
import { OfficeLocationCatalogManagementScreen } from "@/components/office-location-catalog/office-location-catalog-management-screen";
import { AdminWorkerManagementMobileLayout } from "../admin-worker-management-mobile-layout";

export function AdminWorkerLocationCatalogMobile() {
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
      title="Шаблоны локаций"
      onRefresh={handleRefresh}
      rightSlot={headerSlot}
      inlineTitle
    >
      <OfficeLocationCatalogManagementScreen
        variant="admin-worker"
        onRegisterRefresh={handleRegisterRefresh}
        onRegisterHeaderSlot={setHeaderSlot}
      />
    </AdminWorkerManagementMobileLayout>
  );
}
