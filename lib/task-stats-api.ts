import api from "@/lib/api";
import { teamFilter, type StatsDepartment, type StatsEmployeesScope, type StatsPeriod, type TaskStats, type TeamStatsResponse } from "@/lib/task-stats";

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

/**
 * «Вся команда»: the departments and companies the user heads, or one `department` of them, summed,
 * with each employee's row.
 */
export async function fetchTeamStats(
  period: Pick<StatsPeriod, "from" | "to">,
  department: StatsDepartment | null,
  signal?: AbortSignal,
): Promise<TeamStatsResponse> {
  const params = new URLSearchParams({ from: period.from, to: period.to, ...teamFilter(department) });
  const res = await api.get<TeamStatsResponse>(`/user-tasks/stats/team?${params}`, { signal });
  return res.data;
}
