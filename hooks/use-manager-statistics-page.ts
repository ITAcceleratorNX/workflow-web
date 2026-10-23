"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getMeetingRoomStats, type MeetingRoomStats } from "@/lib/api";
import { listLoadError } from "@/lib/request-list-loading";
import { exportManagerAnalytics } from "@/lib/manager-stats-export";
import {
  eachDayKey,
  formatRangeLabel,
  isInRange,
  managerStatsRange,
  parseDateKey,
  type ManagerStatsPeriod,
} from "@/lib/manager-period";
import {
  getManagerAnalytics,
  managerAnalyticsParams,
  type ManagerDetailedStats,
  type ManagerRatingStats,
  type ManagerSlaStats,
} from "@/lib/manager-stats-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStatsStore } from "@/stores/statsStore";

export type OfficeType = {
  id: number;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lon: number | null;
  photo?: string | null;
};

export interface StatisticsSeriesPoint {
  /** Ключ дня (ГГГГ-ММ-ДД) или месяца (ГГГГ-ММ) для длинных периодов. */
  key: string;
  count: number;
}

export interface ManagerAnalyticsData {
  sla: ManagerSlaStats;
  ratings: ManagerRatingStats;
  detailed: ManagerDetailedStats;
}

type Loadable<T> = { data: T | null; loading: boolean; error: string | null };

/** Периоды длиннее ~3 месяцев на графиках группируются по месяцам. */
const DAILY_LIMIT_DAYS = 93;

export function useManagerStatisticsPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const { managerStats, fetchStats, resetStats, loading: statsLoading, error: statsError } = useStatsStore();

  const [period, setPeriod] = useState<ManagerStatsPeriod>("month");
  const [office, setOffice] = useState("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  const [offices, setOffices] = useState<OfficeType[]>([]);

  const basePath = user?.role === "admin-worker" ? "/admin-worker/requests" : "/manager/requests";
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportLock = useRef(false);
  const canExport = user?.role === "manager";

  const range = useMemo(
    () => managerStatsRange(period, { from: customFrom, to: customTo }),
    // Пересчитываем при смене фильтров; «сегодня» берётся на момент выбора.
    [period, customFrom, customTo],
  );
  const rangeLabel = formatRangeLabel(range.fromKey, range.toKey);
  const officeName = office === "all" ? "Все офисы" : offices.find((o) => String(o.id) === office)?.name ?? "Офис";
  const officeNameById = useCallback(
    (id: number | null | undefined) => offices.find((o) => o.id === id)?.name ?? (id != null ? `Офис ${id}` : "—"),
    [offices],
  );

  const applyCustomRange = useCallback((from: Date, to: Date) => {
    setCustomFrom(from <= to ? from : to);
    setCustomTo(from <= to ? to : from);
    setPeriod("custom");
  }, []);

  const selectPeriod = useCallback((next: Exclude<ManagerStatsPeriod, "custom">) => {
    setPeriod(next);
    setCustomFrom(undefined);
    setCustomTo(undefined);
  }, []);

  const requestUrl = useCallback((key?: string, value?: string) => {
    const params = new URLSearchParams();
    if (period !== "custom") params.set("period", period);
    if (office !== "all") params.set("office_id", office);
    if (key && value) params.set(key, value);
    return `${basePath}?${params}`;
  }, [basePath, office, period]);

  const fetchOffices = useCallback(async () => {
    try {
      const response = await api.get("/offices");
      setOffices(response.data);
    } catch (error) {
      console.error("Failed to fetch offices:", error);
    }
  }, []);

  useEffect(() => {
    if (token && (user?.role === "manager" || user?.role === "admin-worker")) {
      fetchStats("manager");
      // Администратор работает по всем офисам — селект офиса нужен и ему.
      fetchOffices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  // --- Обзор: агрегаты /analytics/stats/manager по офису и периоду ---
  const days = useMemo(() => {
    const subset = office === "all" ? managerStats : managerStats.filter((s) => s.officeId === Number(office));
    const byDay = new Map<string, {
      total: number; newRequests: number; inWork: number; completed: number; overdue: number;
      normal: number; urgent: number; planned: number;
    }>();
    for (const stat of subset ?? []) {
      for (const [date, d] of Object.entries(stat.data)) {
        if (!isInRange(date, range)) continue;
        const day = byDay.get(date) ?? { total: 0, newRequests: 0, inWork: 0, completed: 0, overdue: 0, normal: 0, urgent: 0, planned: 0 };
        day.total += Number(d.totalRequests) || 0;
        day.newRequests += Number(d.newRequests) || 0;
        day.inWork += Number(d.inWorkRequests) || 0;
        day.completed += Number(d.completedRequests) || 0;
        day.overdue += Number(d.overdueRequests) || 0;
        day.normal += Number(d.normalRequests) || 0;
        day.urgent += Number(d.urgentRequests) || 0;
        day.planned += Number(d.plannedRequests) || 0;
        byDay.set(date, day);
      }
    }
    return byDay;
  }, [managerStats, office, range]);

  const summary = useMemo(() => {
    const totals = { total: 0, newRequests: 0, inWork: 0, completed: 0, overdue: 0, normal: 0, urgent: 0, planned: 0 };
    for (const day of days.values()) {
      for (const key of Object.keys(totals) as (keyof typeof totals)[]) totals[key] += day[key];
    }
    const pct = (n: number) => (totals.total > 0 ? Math.round((n / totals.total) * 100) : 0);
    const dayCount = Math.max(1, eachDayKey(range.fromKey, range.toKey).length);
    return {
      ...totals,
      completionRate: pct(totals.completed),
      overdueRate: pct(totals.overdue),
      urgentRate: pct(totals.urgent),
      normalRate: pct(totals.normal),
      plannedRate: pct(totals.planned),
      avgPerDay: totals.total / dayCount,
    };
  }, [days, range]);

  const allDayKeys = useMemo(() => eachDayKey(range.fromKey, range.toKey), [range]);
  const groupByMonth = allDayKeys.length > DAILY_LIMIT_DAYS;

  const series: StatisticsSeriesPoint[] = useMemo(() => {
    if (!groupByMonth) return allDayKeys.map((key) => ({ key, count: days.get(key)?.total ?? 0 }));
    const months = new Map<string, number>();
    for (const key of allDayKeys) {
      const month = key.slice(0, 7);
      months.set(month, (months.get(month) ?? 0) + (days.get(key)?.total ?? 0));
    }
    return [...months].map(([key, count]) => ({ key, count }));
  }, [allDayKeys, days, groupByMonth]);

  // --- Сроки, оценки, категории и исполнители: бэкенд с фильтрами ---
  const [analytics, setAnalytics] = useState<Loadable<ManagerAnalyticsData>>({ data: null, loading: true, error: null });
  const analyticsVersion = useRef(0);
  const filters = useMemo(() => ({ office, fromKey: range.fromKey, toKey: range.toKey }), [office, range]);

  const loadAnalytics = useCallback(async () => {
    const version = ++analyticsVersion.current;
    setAnalytics((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getManagerAnalytics(filters);
      if (version === analyticsVersion.current) setAnalytics({ data, loading: false, error: null });
    } catch (failure) {
      if (version === analyticsVersion.current) setAnalytics({ data: null, loading: false, error: listLoadError(failure) });
    }
  }, [filters]);

  const [rooms, setRooms] = useState<Loadable<MeetingRoomStats>>({ data: null, loading: true, error: null });
  const roomsVersion = useRef(0);
  const loadRooms = useCallback(async () => {
    const version = ++roomsVersion.current;
    setRooms((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await getMeetingRoomStats(managerAnalyticsParams(filters));
      if (version === roomsVersion.current) setRooms({ data: response.data, loading: false, error: null });
    } catch (failure) {
      if (version === roomsVersion.current) setRooms({ data: null, loading: false, error: listLoadError(failure) });
    }
  }, [filters]);

  useEffect(() => {
    if (!token) return;
    void loadAnalytics();
    void loadRooms();
  }, [token, loadAnalytics, loadRooms]);

  const handleRefresh = useCallback(async () => {
    try {
      resetStats();
      await Promise.all([fetchStats("manager"), fetchOffices(), loadAnalytics(), loadRooms()]);
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
    }
  }, [resetStats, fetchStats, fetchOffices, loadAnalytics, loadRooms]);

  const handleExport = useCallback(async (format: "xlsx" | "pbix") => {
    if (exportLock.current || !canExport) return;
    exportLock.current = true;
    setExporting(true);
    setExportError(null);
    try {
      await exportManagerAnalytics(token, {
        office,
        startDate: parseDateKey(range.fromKey),
        endDate: parseDateKey(range.toKey),
        format,
      });
    } catch (failure) {
      setExportError(failure instanceof Error && !("isAxiosError" in failure) ? failure.message : `Не удалось экспортировать файл. ${listLoadError(failure)}`);
    } finally {
      exportLock.current = false;
      setExporting(false);
    }
  }, [token, office, range, canExport]);

  const openRequests = useCallback((key?: string, value?: string) => {
    router.push(requestUrl(key, value));
  }, [router, requestUrl]);

  return {
    user,
    period,
    selectPeriod,
    applyCustomRange,
    office,
    setOffice,
    offices,
    officeName,
    officeNameById,
    range,
    rangeLabel,
    summary,
    series,
    groupByMonth,
    overviewLoading: statsLoading && managerStats.length === 0,
    overviewError: statsError,
    analytics,
    reloadAnalytics: loadAnalytics,
    rooms,
    reloadRooms: loadRooms,
    handleRefresh,
    handleExport,
    exporting,
    exportError,
    canExport,
    openRequests,
  };
}

export type UseManagerStatisticsPageResult = ReturnType<typeof useManagerStatisticsPage>;
