"use client";

import { useCallback, useRef, useState } from "react";
import { CompaniesManagementScreen } from "@/components/companies/companies-management-screen";
import { DepartmentHeadManagementMobileLayout } from "../department-head-management-mobile-layout";

export function DepartmentHeadCompaniesMobile() {
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
      title="Компании"
      onRefresh={handleRefresh}
      rightSlot={headerSlot}
      inlineTitle
    >
      <CompaniesManagementScreen
        variant="department-head"
        onRegisterRefresh={handleRegisterRefresh}
        onRegisterHeaderSlot={setHeaderSlot}
      />
    </DepartmentHeadManagementMobileLayout>
  );
}
