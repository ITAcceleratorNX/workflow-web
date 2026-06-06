import api from "@/lib/api";

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
    return { ok: true, data: res.data ?? [] };
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      "Не удалось загрузить статистику";
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
