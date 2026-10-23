import api from "@/lib/api";
import { listLoadError } from "@/lib/request-list-loading";

/** Ответ /analytics/stats/manager: по офисам и датам */
export interface ManagerStatsRawItem {
  officeId: number;
  data: Record<
    string,
    {
      totalRequests: number;
      newRequests: number;
      inWorkRequests: number;
      completedRequests: number;
      overdueRequests: number;
      normalRequests: number;
      urgentRequests: number;
      plannedRequests: number;
    }
  >;
}

export interface ManagerStatsAggregated {
  totalRequests: number;
  statusCounts: {
    new: number;
    inWork: number;
    completed: number;
    overdue: number;
  };
  requestTypeSummary: Record<string, number>;
}

export async function getManagerStats(): Promise<
  { ok: true; data: ManagerStatsRawItem[] } | { ok: false; error: string }
> {
  try {
    const res = await api.get<ManagerStatsRawItem[]>("/analytics/stats/manager");
    if (!Array.isArray(res.data)) throw new Error("Invalid statistics response");
    return { ok: true, data: res.data };
  } catch (error: unknown) {
    const message = listLoadError(error);
    return { ok: false, error: message };
  }
}

/** Агрегирует сырые данные manager в плоскую структуру для mobile UI */
export function aggregateManagerStats(raw: ManagerStatsRawItem[]): ManagerStatsAggregated {
  let totalRequests = 0;
  let newCount = 0;
  let inWork = 0;
  let completed = 0;
  let overdue = 0;
  let normal = 0;
  let urgent = 0;
  let planned = 0;

  for (const item of raw ?? []) {
    const data = item.data ?? {};
    for (const day of Object.values(data)) {
      if (!day || typeof day !== "object") continue;
      totalRequests += Number(day.totalRequests) || 0;
      newCount += Number(day.newRequests) || 0;
      inWork += Number(day.inWorkRequests) || 0;
      completed += Number(day.completedRequests) || 0;
      overdue += Number(day.overdueRequests) || 0;
      normal += Number(day.normalRequests) || 0;
      urgent += Number(day.urgentRequests) || 0;
      planned += Number(day.plannedRequests) || 0;
    }
  }

  return {
    totalRequests,
    statusCounts: {
      new: newCount,
      inWork,
      completed,
      overdue,
    },
    requestTypeSummary: { normal, urgent, planned },
  };
}

/** Фильтры детальной аналитики: офис и период (ГГГГ-ММ-ДД, включительно). */
export interface ManagerAnalyticsFilters {
  office: string;
  fromKey: string;
  toKey: string;
}

export interface ManagerSlaCategory {
  categoryName: string;
  avgHours: string;
  totalCompleted: number;
}

export interface ManagerSlaStats {
  totalCompleted: number;
  avgHours: string | null;
  byDate: Array<{ date: string; avgHours: string; totalCompleted: number; byCategory: ManagerSlaCategory[] }>;
  byCategory: ManagerSlaCategory[];
  byOffice: Array<{ officeId: number; avgHours: string; totalCompleted: number }>;
}

export interface ManagerRatingRow {
  avgRating: string;
  totalRatings: number;
  lowRatings: number;
}

export interface ManagerRatingStats {
  summary: {
    avgRating: string | null;
    totalRatings: number;
    lowRatings: number;
    distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  };
  byOffice: Array<ManagerRatingRow & { officeId: number }>;
  byCategory: Array<ManagerRatingRow & { categoryName: string }>;
  byExecutor: Array<ManagerRatingRow & { executorId: number }>;
  byDate: Array<ManagerRatingRow & { date: string }>;
}

export interface ManagerDetailedStats {
  byCategory: Array<{
    categoryId: number;
    categoryName: string;
    officeId: number;
    officeName: string | null;
    totalRequests: number;
    completedRequests: number;
    newRequests: number;
    inWorkRequests: number;
  }>;
  byExecutor: Array<{
    executorId: number;
    executorName: string | null;
    totalAssigned: number;
    completedRequests: number;
    inWorkRequests: number;
  }>;
}

export function managerAnalyticsParams(filters: ManagerAnalyticsFilters) {
  const params: Record<string, string> = { from: filters.fromKey, to: filters.toKey };
  if (filters.office !== "all") params.office_id = filters.office;
  return params;
}

export async function getManagerAnalytics(filters: ManagerAnalyticsFilters) {
  const params = managerAnalyticsParams(filters);
  const [sla, ratings, detailed] = await Promise.all([
    api.get<ManagerSlaStats>("/analytics/stats/manager/sla", { params }),
    api.get<ManagerRatingStats>("/analytics/stats/manager/ratings", { params }),
    api.get<ManagerDetailedStats>("/analytics/stats/manager/detailed", { params }),
  ]);
  return { sla: sla.data, ratings: ratings.data, detailed: detailed.data };
}
