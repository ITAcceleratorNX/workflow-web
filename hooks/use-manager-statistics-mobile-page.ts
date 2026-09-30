"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aggregateManagerStats, getManagerStats, type ManagerStatsRawItem } from "@/lib/manager-stats-api";
import { exportManagerAnalytics } from "@/lib/manager-stats-export";
import { listLoadError } from "@/lib/request-list-loading";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";

export type ManagerStatisticsMobileTab = "stats" | "analytics";
type SlaRow = { officeId: number; avgHours: string; totalCompleted: number };
type RatingRow = { officeId: number; avgRating: string; totalRatings: number; lowRatings: number };
type Analytics = { sla: SlaRow[]; ratings: RatingRow[]; offices: { id: number; name: string }[] };

export function useManagerStatisticsMobilePage() {
  const token = useAuthStore((s) => s.token);
  const [activeTab, setActiveTab] = useState<ManagerStatisticsMobileTab>("stats");
  const [rawStats, setRawStats] = useState<ManagerStatsRawItem[] | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportLock = useRef(false);
  const statsVersion = useRef(0);
  const analyticsVersion = useRef(0);

  const loadStats = useCallback(async () => {
    const version = ++statsVersion.current;
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const result = await getManagerStats();
    if (version !== statsVersion.current) return;
    if (result.ok) setRawStats(result.data);
    else setError(result.error);
    setLoading(false);
  }, [token]);

  const loadAnalytics = useCallback(async () => {
    const version = ++analyticsVersion.current;
    if (!token) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const [sla, ratings, offices] = await Promise.all([
        api.get<{ byOffice: SlaRow[] }>("/analytics/stats/manager/sla"),
        api.get<{ byOffice: RatingRow[] }>("/analytics/stats/manager/ratings"),
        api.get<{ id: number; name: string }[]>("/offices"),
      ]);
      if (!Array.isArray(sla.data.byOffice) || !Array.isArray(ratings.data.byOffice) || !Array.isArray(offices.data)) {
        throw new Error("Invalid analytics response");
      }
      if (version === analyticsVersion.current) setAnalytics({ sla: sla.data.byOffice, ratings: ratings.data.byOffice, offices: offices.data });
    } catch (failure) {
      if (version === analyticsVersion.current) setAnalyticsError(listLoadError(failure));
    } finally {
      if (version === analyticsVersion.current) setAnalyticsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadStats();
    return () => { statsVersion.current += 1; };
  }, [loadStats]);
  useEffect(() => {
    if (activeTab === "analytics") void loadAnalytics();
    return () => { analyticsVersion.current += 1; };
  }, [activeTab, loadAnalytics]);

  const stats = useMemo(() => rawStats ? aggregateManagerStats(rawStats) : null, [rawStats]);
  const handleRefresh = useCallback(async () => {
    await (activeTab === "stats" ? loadStats() : loadAnalytics());
  }, [activeTab, loadStats, loadAnalytics]);

  const handleExport = useCallback(async (format: "xlsx" | "pbix") => {
    if (exportLock.current) return;
    exportLock.current = true;
    setExporting(true);
    setExportError(null);
    try { await exportManagerAnalytics(token, { format }); }
    catch (failure) { setExportError(failure instanceof Error && !("isAxiosError" in failure) ? failure.message : `Не удалось экспортировать файл. ${listLoadError(failure)}`); }
    finally { exportLock.current = false; setExporting(false); }
  }, [token]);

  return {
    activeTab, setActiveTab, stats, analytics, loading, analyticsLoading, error, analyticsError,
    exporting, exportError, handleRefresh, handleExport, retry: loadStats, retryAnalytics: loadAnalytics,
  };
}

export type UseManagerStatisticsMobilePageResult = ReturnType<typeof useManagerStatisticsMobilePage>;
