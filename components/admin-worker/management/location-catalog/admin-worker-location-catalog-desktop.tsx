"use client";

import { useCallback, useRef, useState } from "react";
import { OfficeLocationCatalogManagementScreen } from "@/components/office-location-catalog/office-location-catalog-management-screen";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { ADMIN_WORKER_MANAGEMENT_BACK_HREF } from "@/hooks/use-admin-worker-management-crud-page";

export function AdminWorkerLocationCatalogDesktop() {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const [headerSlot, setHeaderSlot] = useState<React.ReactNode>(null);
  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  return (
    <DesktopManagementPage
      title="Шаблоны локаций"
      backHref={ADMIN_WORKER_MANAGEMENT_BACK_HREF}
      actions={headerSlot}
    >
      <OfficeLocationCatalogManagementScreen
        variant="admin-worker"
        onRegisterRefresh={handleRegisterRefresh}
        onRegisterHeaderSlot={setHeaderSlot}
      />
    </DesktopManagementPage>
  );
}
