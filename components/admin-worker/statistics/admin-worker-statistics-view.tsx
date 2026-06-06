"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { useAdminWorkerStatisticsPage } from "@/hooks/use-admin-worker-statistics-page";
import { AdminWorkerStatisticsDesktopView } from "./admin-worker-statistics-desktop-view";
import { AdminWorkerStatisticsMobileView } from "./admin-worker-statistics-mobile-view";

export function AdminWorkerStatisticsView() {
  const isDesktop = useIsDesktop();
  const { stats, loading, error, handleRefresh, retry } = useAdminWorkerStatisticsPage();

  if (isDesktop) {
    return <AdminWorkerStatisticsDesktopView />;
  }

  return (
    <AdminWorkerStatisticsMobileView
      stats={stats}
      loading={loading}
      error={error}
      onRefresh={handleRefresh}
      onRetry={retry}
    />
  );
}
