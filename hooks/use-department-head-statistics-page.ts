"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDepartmentHeadStats,
  type DepartmentHeadStats,
} from "@/lib/department-head-stats-api";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStatsStore } from "@/stores/statsStore";

export function useDepartmentHeadStatisticsPage() {
  const token = useAuthStore((s) => s.token);
  const isDesktop = useIsDesktop();
  const { fetchStats, resetStats } = useStatsStore();
  const [stats, setStats] = useState<DepartmentHeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!token) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await getDepartmentHeadStats();
    if (result.ok) {
      setStats(result.data);
    } else {
      setError(result.error);
      setStats(null);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (token && isDesktop) {
      fetchStats("department-head");
    }
  }, [token, isDesktop, fetchStats]);

  const handleRefresh = useCallback(async () => {
    setStats(null);
    resetStats();
    await Promise.all([
      loadStats(),
      isDesktop ? fetchStats("department-head") : Promise.resolve(),
    ]);
  }, [loadStats, resetStats, fetchStats, isDesktop]);

  return {
    stats,
    loading,
    error,
    handleRefresh,
    retry: loadStats,
  };
}

export type UseDepartmentHeadStatisticsPageResult = ReturnType<
  typeof useDepartmentHeadStatisticsPage
>;
