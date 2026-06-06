import api from "@/lib/api";

export interface AdminWorkerStats {
  totalRequests: number;
  statusCounts: {
    new: number;
    inWork: number;
    completed: number;
    overdue: number;
  };
  requestTypeSummary: Record<string, number>;
}

function normalizeAdminWorkerStats(
  data: Partial<AdminWorkerStats> | null | undefined,
): AdminWorkerStats {
  return {
    totalRequests: typeof data?.totalRequests === "number" ? data.totalRequests : 0,
    statusCounts: {
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

export async function getAdminWorkerStats(): Promise<
  { ok: true; data: AdminWorkerStats } | { ok: false; error: string }
> {
  try {
    const res = await api.get<AdminWorkerStats>("/analytics/stats/admin-worker");
    return { ok: true, data: normalizeAdminWorkerStats(res.data) };
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      "Не удалось загрузить статистику";
    return { ok: false, error: message };
  }
}
