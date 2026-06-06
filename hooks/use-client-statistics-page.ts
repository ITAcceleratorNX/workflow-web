"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTaskCompletionStats } from "@/hooks/use-task-completion-stats";

export interface ClientAnalyticsStats {
  totalRequests: number;
  activeRequests: number;
  doneRequests: number;
  averageRating: string;
  totalRatings: number;
}

export function useClientStatisticsPage() {
  const isDesktop = useIsDesktop();
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<ClientAnalyticsStats | null>(null);
  const [loadingDesktop, setLoadingDesktop] = useState(false);

  const taskStats = useTaskCompletionStats(!isDesktop);

  const fetchClientStats = useCallback(async () => {
    if (!token) return;
    setLoadingDesktop(true);
    try {
      const res = await api.get<ClientAnalyticsStats>("/analytics/stats/client");
      setStats(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDesktop(false);
    }
  }, [token]);

  useEffect(() => {
    if (isDesktop && token && !stats) {
      fetchClientStats();
    }
  }, [isDesktop, token, stats, fetchClientStats]);

  const handleRefresh = useCallback(async () => {
    if (isDesktop) {
      setStats(null);
      await fetchClientStats();
    } else {
      await taskStats.refresh();
    }
  }, [fetchClientStats, isDesktop, taskStats]);

  return {
    isDesktop,
    stats,
    loadingDesktop,
    taskStats,
    handleRefresh,
  };
}

export type UseClientStatisticsPageResult = ReturnType<typeof useClientStatisticsPage>;
