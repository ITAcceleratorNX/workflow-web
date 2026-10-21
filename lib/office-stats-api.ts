import api from "@/lib/api";

/** Статистика заявок офиса для Администратора и Офис-менеджера (/analytics/stats/<role>). */
export type OfficeStatsRole = "admin-worker" | "department-head";

export interface OfficeStats {
  totalRequests: number;
  statusCounts: {
    /** Только у Офис-менеджера: заявки, ждущие назначения исполнителя. */
    awaitingAssignment: number;
    new: number;
    inWork: number;
    completed: number;
    overdue: number;
  };
  requestTypeSummary: Record<string, number>;
}

const num = (value: unknown) => (typeof value === "number" ? value : 0);

function normalizeOfficeStats(data: Partial<OfficeStats> | null | undefined): OfficeStats {
  const sc = data?.statusCounts;
  return {
    totalRequests: num(data?.totalRequests),
    statusCounts: {
      awaitingAssignment: num(sc?.awaitingAssignment),
      new: num(sc?.new),
      inWork: num(sc?.inWork),
      completed: num(sc?.completed),
      overdue: num(sc?.overdue),
    },
    requestTypeSummary:
      data?.requestTypeSummary && typeof data.requestTypeSummary === "object" ? data.requestTypeSummary : {},
  };
}

export async function getOfficeStats(
  role: OfficeStatsRole,
): Promise<{ ok: true; data: OfficeStats } | { ok: false; error: string }> {
  try {
    const res = await api.get<OfficeStats>(`/analytics/stats/${role}`);
    return { ok: true, data: normalizeOfficeStats(res.data) };
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      "Не удалось загрузить статистику";
    return { ok: false, error: message };
  }
}
