"use client";

import { useAdminWorkerHome } from "@/hooks/use-admin-worker-home";
import { AdminWorkerHomeDesktop } from "./admin-worker-home-desktop";
import { ManagementHomeMobile } from "@/components/layout/management-home-mobile";
import { adminWorkerHomeCardsFor } from "./admin-worker-home-constants";

export function AdminWorkerHomeView() {
  const state = useAdminWorkerHome();

  if (state.isDesktop) {
    return <AdminWorkerHomeDesktop />;
  }

  return (
    <ManagementHomeMobile
      title="Управление системой"
      subtitle="Выберите раздел для управления"
      cards={adminWorkerHomeCardsFor("mobile")}
      onRefresh={state.handleRefresh}
    />
  );
}
