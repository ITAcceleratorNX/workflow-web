"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useClientStatisticsPage } from "@/hooks/use-client-statistics-page";
import { ClientStatisticsDesktopView } from "./client-statistics-desktop-view";
import { ClientStatisticsMobileView } from "./client-statistics-mobile-view";

export function ClientStatisticsView() {
  const token = useAuthStore((s) => s.token);
  const { isDesktop, stats, taskStats, handleRefresh } = useClientStatisticsPage();

  if (isDesktop) {
    return <ClientStatisticsDesktopView stats={stats} onRefresh={handleRefresh} />;
  }

  return (
    <ClientStatisticsMobileView
      taskStats={taskStats}
      onRefresh={handleRefresh}
      hasToken={!!token}
    />
  );
}
