"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  aggregateManagerStats,
  getManagerStats,
  type ManagerStatsAggregated,
  type ManagerStatsRawItem,
} from "@/lib/manager-stats-api";
import { exportManagerAnalytics } from "@/lib/manager-stats-export";
import { useAuthStore } from "@/stores/useAuthStore";

export type ManagerStatisticsMobileTab = "stats" | "analytics";

export function useManagerStatisticsMobilePage() {
  const token = useAuthStore((s) => s.token);
  const [activeTab, setActiveTab] = useState<ManagerStatisticsMobileTab>("stats");
  const [rawStats, setRawStats] = useState<ManagerStatsRawItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!token) {
      setRawStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await getManagerStats();
    if (result.ok) {
      setRawStats(result.data);
    } else {
      setError(result.error);
      setRawStats(null);
    }
    setLoading(false);
  }, [token]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setAnalyticsLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === "analytics") loadAnalytics();
  }, [activeTab, loadAnalytics]);

  const stats: ManagerStatsAggregated | null = useMemo(
    () => (rawStats && rawStats.length > 0 ? aggregateManagerStats(rawStats) : null),
    [rawStats],
  );

  const handleRefresh = useCallback(async () => {
    if (activeTab === "stats") {
      await loadStats();
    } else {
      await loadAnalytics();
    }
  }, [activeTab, loadStats, loadAnalytics]);

  const handleExport = useCallback(
    async (format: "xlsx" | "pbix") => {
      await exportManagerAnalytics(token, { format });
    },
    [token],
  );

  return {
    activeTab,
    setActiveTab,
    stats,
    loading,
    analyticsLoading,
    error,
    handleRefresh,
    handleExport,
    retry: loadStats,
  };
}

export type UseManagerStatisticsMobilePageResult = ReturnType<typeof useManagerStatisticsMobilePage>;
