"use client";

import { useCallback, useRef, useState } from "react";
import { OfficeLocationCatalogManagementScreen } from "@/components/office-location-catalog/office-location-catalog-management-screen";
import { DepartmentHeadManagementMobileLayout } from "../department-head-management-mobile-layout";

export function DepartmentHeadLocationCatalogMobile() {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const [headerSlot, setHeaderSlot] = useState<React.ReactNode>(null);

  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  const handleRefresh = useCallback(async () => {
    await refreshRef.current?.();
  }, []);

  return (
    <DepartmentHeadManagementMobileLayout
      title="Шаблоны локаций"
      onRefresh={handleRefresh}
      rightSlot={headerSlot}
      inlineTitle
    >
      <OfficeLocationCatalogManagementScreen
        variant="department-head"
        onRegisterRefresh={handleRegisterRefresh}
        onRegisterHeaderSlot={setHeaderSlot}
      />
    </DepartmentHeadManagementMobileLayout>
  );
}
