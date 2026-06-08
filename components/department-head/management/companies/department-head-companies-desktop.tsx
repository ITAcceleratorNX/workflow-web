"use client";

import { useCallback, useRef, useState } from "react";
import { CompaniesManagementScreen } from "@/components/companies/companies-management-screen";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF } from "@/hooks/use-department-head-management-crud-page";

export function DepartmentHeadCompaniesDesktop() {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const [headerSlot, setHeaderSlot] = useState<React.ReactNode>(null);
  const handleRegisterRefresh = useCallback((refetch: () => Promise<void>) => {
    refreshRef.current = refetch;
  }, []);

  return (
    <DesktopManagementPage
      title="Компании"
      backHref={DEPARTMENT_HEAD_MANAGEMENT_BACK_HREF}
      actions={headerSlot}
    >
      <CompaniesManagementScreen
        variant="department-head"
        onRegisterRefresh={handleRegisterRefresh}
        onRegisterHeaderSlot={setHeaderSlot}
      />
    </DesktopManagementPage>
  );
}
