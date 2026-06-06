"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsDesktop } from "@/hooks/use-media-query";
import { getExecutorStats, type ExecutorStats } from "@/lib/executor-stats-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStatsStore } from "@/stores/statsStore";

export function useExecutorStatisticsPage() {
  const isDesktop = useIsDesktop();
  const token = useAuthStore((s) => s.token);
  const { myRating, fetchStats, resetStats } = useStatsStore();

  const [stats, setStats] = useState<ExecutorStats | null>(null);
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

    try {
      if (isDesktop) {
        await fetchStats("executor");
      }

      const result = await getExecutorStats();
      if (result.ok) {
        setStats(result.data);
      } else {
        setError(result.error);
        setStats(null);
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить статистику");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, isDesktop, token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = useCallback(async () => {
    if (isDesktop) {
      resetStats();
    }
    await loadStats();
  }, [isDesktop, loadStats, resetStats]);

  return {
    isDesktop,
    stats,
    myRating,
    loading,
    error,
    handleRefresh,
    retry: loadStats,
  };
}

export type UseExecutorStatisticsPageResult = ReturnType<typeof useExecutorStatisticsPage>;
