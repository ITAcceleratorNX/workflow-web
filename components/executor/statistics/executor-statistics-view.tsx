"use client";

import { useExecutorStatisticsPage } from "@/hooks/use-executor-statistics-page";
import { ExecutorStatisticsDesktopView } from "./executor-statistics-desktop-view";
import { ExecutorStatisticsMobileView } from "./executor-statistics-mobile-view";

export function ExecutorStatisticsView() {
  const { isDesktop, stats, myRating, loading, error, handleRefresh, retry } =
    useExecutorStatisticsPage();

  if (isDesktop) {
    return <ExecutorStatisticsDesktopView stats={stats} myRating={myRating} />;
  }

  return (
    <ExecutorStatisticsMobileView
      stats={stats}
      loading={loading}
      error={error}
      onRefresh={handleRefresh}
      onRetry={retry}
    />
  );
}
