"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { useDepartmentHeadStatisticsPage } from "@/hooks/use-department-head-statistics-page";
import { DepartmentHeadStatisticsDesktopView } from "./department-head-statistics-desktop-view";
import { DepartmentHeadStatisticsMobileView } from "./department-head-statistics-mobile-view";

export function DepartmentHeadStatisticsView() {
  const isDesktop = useIsDesktop();
  const { stats, loading, error, handleRefresh, retry } = useDepartmentHeadStatisticsPage();

  if (isDesktop) {
    return <DepartmentHeadStatisticsDesktopView stats={stats} />;
  }

  return (
    <DepartmentHeadStatisticsMobileView
      stats={stats}
      loading={loading}
      error={error}
      onRefresh={handleRefresh}
      onRetry={retry}
    />
  );
}
