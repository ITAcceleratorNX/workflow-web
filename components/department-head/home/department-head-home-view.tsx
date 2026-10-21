"use client";

import { useDepartmentHeadHome } from "@/hooks/use-department-head-home";
import { DepartmentHeadHomeDesktop } from "./department-head-home-desktop";
import { ManagementHomeMobile } from "@/components/layout/management-home-mobile";
import { DEPARTMENT_HEAD_HOME_CARDS } from "./department-head-home-constants";

export function DepartmentHeadHomeView() {
  const state = useDepartmentHeadHome();

  if (state.isDesktop) {
    return <DepartmentHeadHomeDesktop />;
  }

  return (
    <ManagementHomeMobile
      title="Управление"
      subtitle="Выберите раздел"
      cards={DEPARTMENT_HEAD_HOME_CARDS}
      onRefresh={state.handleRefresh}
    />
  );
}
