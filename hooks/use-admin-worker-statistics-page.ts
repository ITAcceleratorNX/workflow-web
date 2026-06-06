"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminWorkerStats, type AdminWorkerStats } from "@/lib/admin-worker-stats-api";
import { useAuthStore } from "@/stores/useAuthStore";

export function useAdminWorkerStatisticsPage() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<AdminWorkerStats | null>(null);
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

    const result = await getAdminWorkerStats();
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

  return {
    stats,
    loading,
    error,
    handleRefresh: loadStats,
    retry: loadStats,
  };
}

export type UseAdminWorkerStatisticsPageResult = ReturnType<typeof useAdminWorkerStatisticsPage>;
