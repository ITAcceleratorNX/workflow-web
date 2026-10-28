import api from "@/lib/api";
import type { StatsEmployeesScope, StatsPeriod, TaskStats } from "@/lib/task-stats";

/** Own statistics, or an employee's (`userId`) within the departments the user heads. */
export async function fetchTaskStats(period: Pick<StatsPeriod, "from" | "to">, userId: number | null, signal?: AbortSignal): Promise<TaskStats> {
  const params = new URLSearchParams({ from: period.from, to: period.to });
  if (userId != null) params.set("user_id", String(userId));
  const res = await api.get<TaskStats>(`/user-tasks/stats?${params}`, { signal });
  return res.data;
}

/** Departments and employees whose statistics the user may open; empty for everyone else. */
export async function fetchStatsEmployees(signal?: AbortSignal): Promise<StatsEmployeesScope> {
  const res = await api.get<StatsEmployeesScope>("/user-tasks/stats/employees", { signal });
  return res.data;
}
