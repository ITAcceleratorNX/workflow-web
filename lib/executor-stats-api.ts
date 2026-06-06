import api from "@/lib/api";

export interface ExecutorStats {
  totalRequests: number;
  overdue: number;
  inWork: number;
  completed: number;
  onTime: number;
  late?: number;
  averageExecutionHours: string;
  averageRating: string;
}

function normalizeExecutorStats(data: Partial<ExecutorStats> | null | undefined): ExecutorStats {
  return {
    totalRequests: typeof data?.totalRequests === "number" ? data.totalRequests : 0,
    overdue: typeof data?.overdue === "number" ? data.overdue : 0,
    inWork: typeof data?.inWork === "number" ? data.inWork : 0,
    completed: typeof data?.completed === "number" ? data.completed : 0,
    onTime: typeof data?.onTime === "number" ? data.onTime : 0,
    late: typeof data?.late === "number" ? data.late : 0,
    averageExecutionHours:
      typeof data?.averageExecutionHours === "string" ? data.averageExecutionHours : "0.00",
    averageRating: typeof data?.averageRating === "string" ? data.averageRating : "0.00",
  };
}

export async function getExecutorStats(): Promise<
  { ok: true; data: ExecutorStats } | { ok: false; error: string }
> {
  try {
    const res = await api.get<ExecutorStats>("/analytics/stats/executor");
    return { ok: true, data: normalizeExecutorStats(res.data) };
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      "Не удалось загрузить статистику";
    return { ok: false, error: message };
  }
}
