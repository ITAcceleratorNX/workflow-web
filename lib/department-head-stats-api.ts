import api from "@/lib/api";

export interface DepartmentHeadStats {
  totalRequests: number;
  statusCounts: {
    awaitingAssignment: number;
    new: number;
    inWork: number;
    completed: number;
    overdue: number;
  };
  requestTypeSummary: Record<string, number>;
}

function normalizeDepartmentHeadStats(
  data: Partial<DepartmentHeadStats> | null | undefined,
): DepartmentHeadStats {
  return {
    totalRequests: typeof data?.totalRequests === "number" ? data.totalRequests : 0,
    statusCounts: {
      awaitingAssignment:
        typeof data?.statusCounts?.awaitingAssignment === "number"
          ? data.statusCounts.awaitingAssignment
          : 0,
      new: typeof data?.statusCounts?.new === "number" ? data.statusCounts.new : 0,
      inWork: typeof data?.statusCounts?.inWork === "number" ? data.statusCounts.inWork : 0,
      completed:
        typeof data?.statusCounts?.completed === "number" ? data.statusCounts.completed : 0,
      overdue: typeof data?.statusCounts?.overdue === "number" ? data.statusCounts.overdue : 0,
    },
    requestTypeSummary:
      data?.requestTypeSummary && typeof data.requestTypeSummary === "object"
        ? data.requestTypeSummary
        : {},
  };
}

export async function getDepartmentHeadStats(): Promise<
  { ok: true; data: DepartmentHeadStats } | { ok: false; error: string }
> {
  try {
    const res = await api.get<DepartmentHeadStats>("/analytics/stats/department-head");
    return { ok: true, data: normalizeDepartmentHeadStats(res.data) };
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      "Не удалось загрузить статистику";
    return { ok: false, error: message };
  }
}
