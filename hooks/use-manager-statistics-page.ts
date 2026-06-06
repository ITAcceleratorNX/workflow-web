"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { exportManagerAnalytics } from "@/lib/manager-stats-export";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStatsStore } from "@/stores/statsStore";

export interface ChartData {
  date: string;
  count: number;
}

export type OfficeType = {
  id: number;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lon: number | null;
  photo?: string | null;
};

export function useManagerStatisticsPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const { managerStats, fetchStats, resetStats } = useStatsStore();

  const [period, setPeriod] = useState("month");
  const [office, setOffice] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [offices, setOffices] = useState<OfficeType[]>([]);

  const basePath = user?.role === "admin-worker" ? "/admin-worker" : "/manager";
  const effectiveOffice =
    user?.role === "admin-worker" && user?.office_id ? String(user.office_id) : office;

  const fetchOffices = useCallback(async () => {
    if (offices.length !== 0) return;
    try {
      const response = await api.get("/offices");
      setOffices(response.data);
    } catch (error) {
      console.error("Failed to fetch offices:", error);
    }
  }, [offices.length]);

  useEffect(() => {
    if (token && (user?.role === "manager" || user?.role === "admin-worker")) {
      fetchStats("manager");
      if (user?.role === "manager") fetchOffices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const chartData: ChartData[] = useMemo(() => {
    if (!managerStats || managerStats.length === 0) return [];

    const subset =
      effectiveOffice === "all"
        ? managerStats
        : managerStats.filter((s) => s.officeId === Number(effectiveOffice));

    if (startDate && endDate) {
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      const map: Record<string, number> = {};

      subset.forEach((s) => {
        Object.entries(s.data).forEach(([date, d]) => {
          if (date >= startDateStr && date <= endDateStr) {
            map[date] = (map[date] || 0) + d.totalRequests;
          }
        });
      });

      return Object.entries(map)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    const now = new Date();
    let periodStartDate: Date;
    if (period === "week") {
      periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      periodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else {
      periodStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }
    const periodStartDateStr = periodStartDate.toISOString().split("T")[0];
    const map: Record<string, number> = {};
    subset.forEach((s) => {
      Object.entries(s.data).forEach(([date, d]) => {
        if (date >= periodStartDateStr) map[date] = (map[date] || 0) + d.totalRequests;
      });
    });
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [office, period, startDate, endDate, managerStats, effectiveOffice]);

  const distribution = useMemo(() => {
    if (!managerStats || managerStats.length === 0) return;

    const subset =
      effectiveOffice === "all"
        ? managerStats
        : managerStats.filter((s) => s.officeId === Number(effectiveOffice));

    if (startDate && endDate) {
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      let total = 0;
      let normal = 0;
      let urgent = 0;
      let planned = 0;

      subset.forEach((stat) => {
        Object.entries(stat.data).forEach(([date, data]) => {
          if (date >= startDateStr && date <= endDateStr) {
            total += data.totalRequests;
            normal += data.normalRequests || 0;
            urgent += data.urgentRequests || 0;
            planned += data.plannedRequests || 0;
          }
        });
      });

      const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
      return {
        total,
        normal,
        urgent,
        planned,
        normalPercent: pct(normal),
        urgentPercent: pct(urgent),
        plannedPercent: pct(planned),
      };
    }

    const now = new Date();
    let periodStartDate: Date;
    if (period === "week") {
      periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      periodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else {
      periodStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }
    const periodStartDateStr = periodStartDate.toISOString().split("T")[0];
    let total = 0;
    let normal = 0;
    let urgent = 0;
    let planned = 0;
    subset.forEach((stat) => {
      Object.entries(stat.data).forEach(([date, data]) => {
        if (date >= periodStartDateStr) {
          total += data.totalRequests;
          normal += data.normalRequests || 0;
          urgent += data.urgentRequests || 0;
          planned += data.plannedRequests || 0;
        }
      });
    });
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return {
      total,
      normal,
      urgent,
      planned,
      normalPercent: pct(normal),
      urgentPercent: pct(urgent),
      plannedPercent: pct(planned),
    };
  }, [effectiveOffice, period, startDate, endDate, managerStats]);

  const summary = useMemo(() => {
    if (!managerStats || managerStats.length === 0) {
      return {
        total: 0,
        completed: 0,
        overdue: 0,
        inWork: 0,
        newRequests: 0,
        completionRate: 0,
        overdueRate: 0,
        avgPerDay: 0,
      };
    }

    const subset =
      effectiveOffice === "all"
        ? managerStats
        : managerStats.filter((s) => s.officeId === Number(effectiveOffice));

    if (startDate && endDate) {
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      let total = 0;
      let completed = 0;
      let overdue = 0;
      let inWork = 0;
      let newRequests = 0;
      const dayCounts = new Set<string>();

      subset.forEach((stat) => {
        Object.entries(stat.data).forEach(([date, data]) => {
          if (date >= startDateStr && date <= endDateStr) {
            total += data.totalRequests;
            completed += data.completedRequests;
            overdue += data.overdueRequests || 0;
            inWork += data.inWorkRequests || 0;
            newRequests += data.newRequests || 0;
            dayCounts.add(date);
          }
        });
      });

      const days = dayCounts.size || 1;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0;
      const avgPerDay = Math.round(total / days);
      return { total, completed, overdue, inWork, newRequests, completionRate, overdueRate, avgPerDay };
    }

    const now = new Date();
    let periodStartDate: Date;
    if (period === "week") {
      periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      periodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else {
      periodStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }
    const periodStartDateStr = periodStartDate.toISOString().split("T")[0];
    let total = 0;
    let completed = 0;
    let overdue = 0;
    let inWork = 0;
    let newRequests = 0;
    const dayCounts = new Set<string>();
    subset.forEach((stat) => {
      Object.entries(stat.data).forEach(([date, data]) => {
        if (date >= periodStartDateStr) {
          total += data.totalRequests;
          completed += data.completedRequests;
          overdue += data.overdueRequests || 0;
          inWork += data.inWorkRequests || 0;
          newRequests += data.newRequests || 0;
          dayCounts.add(date);
        }
      });
    });
    const days = dayCounts.size || 1;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0;
    const avgPerDay = Math.round(total / days);
    return { total, completed, overdue, inWork, newRequests, completionRate, overdueRate, avgPerDay };
  }, [managerStats, effectiveOffice, period, startDate, endDate]);

  const handleRefresh = useCallback(async () => {
    try {
      resetStats();
      setOffices([]);
      setPeriod("month");
      setOffice("all");
      setStartDate(undefined);
      setEndDate(undefined);
      await fetchStats("manager");
      if (user?.role === "manager") await fetchOffices();
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
    }
  }, [resetStats, fetchStats, fetchOffices, user?.role]);

  const resetDateFilters = useCallback(() => {
    setStartDate(undefined);
    setEndDate(undefined);
  }, []);

  const handleExport = useCallback(
    async (format: "xlsx" | "pbix") => {
      await exportManagerAnalytics(token, {
        office,
        startDate,
        endDate,
        format,
      });
    },
    [token, office, startDate, endDate],
  );

  const handleTotalRequestsClick = useCallback(() => {
    router.push(basePath);
  }, [router, basePath]);

  const handleNewRequestsClick = useCallback(() => {
    router.push(`${basePath}?status=in_progress`);
  }, [router, basePath]);

  const handleInWorkRequestsClick = useCallback(() => {
    router.push(`${basePath}?status=execution`);
  }, [router, basePath]);

  const handleCompletedRequestsClick = useCallback(() => {
    router.push(`${basePath}?status=completed`);
  }, [router, basePath]);

  const handleOverdueRequestsClick = useCallback(() => {
    router.push(`${basePath}?status=overdue`);
  }, [router, basePath]);

  const handleNormalRequestsClick = useCallback(() => {
    router.push(`${basePath}?priority=normal`);
  }, [router, basePath]);

  const handleUrgentRequestsClick = useCallback(() => {
    router.push(`${basePath}?priority=urgent`);
  }, [router, basePath]);

  const handlePlannedRequestsClick = useCallback(() => {
    router.push(`${basePath}?priority=planned`);
  }, [router, basePath]);

  return {
    user,
    period,
    setPeriod,
    office,
    setOffice,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    offices,
    basePath,
    chartData,
    distribution,
    summary,
    handleRefresh,
    resetDateFilters,
    handleExport,
    handleTotalRequestsClick,
    handleNewRequestsClick,
    handleInWorkRequestsClick,
    handleCompletedRequestsClick,
    handleOverdueRequestsClick,
    handleNormalRequestsClick,
    handleUrgentRequestsClick,
    handlePlannedRequestsClick,
  };
}

export type UseManagerStatisticsPageResult = ReturnType<typeof useManagerStatisticsPage>;
