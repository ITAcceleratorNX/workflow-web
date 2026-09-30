import type { ManagerStatsRawItem } from "@/lib/manager-stats-api";

export function calculateManagerHomeKpi(
  stats: ManagerStatsRawItem[],
  office: string,
  period: string,
  now = new Date(),
) {
  const from = new Date(now);
  if (period === "week") from.setDate(from.getDate() - 7);
  else if (period === "month") from.setMonth(from.getMonth() - 1);
  else if (period === "year") from.setFullYear(from.getFullYear() - 1);
  else from.setTime(0);
  const fromDay = from.toISOString().slice(0, 10);
  const totals = { total: 0, completed: 0, overdue: 0, emergency: 0, inWork: 0 };
  for (const item of stats) {
    if (office !== "all" && item.officeId !== Number(office)) continue;
    for (const [date, day] of Object.entries(item.data)) {
      if (date < fromDay) continue;
      totals.total += Number(day.totalRequests) || 0;
      totals.completed += Number(day.completedRequests) || 0;
      totals.overdue += Number(day.overdueRequests) || 0;
      totals.emergency += Number(day.urgentRequests) || 0;
      totals.inWork += Number(day.inWorkRequests) || 0;
    }
  }
  return totals;
}

export function managerKpiRequestHrefs(basePath: string, office: string, period: string) {
  const href = (key: string, value: string) => {
    const params = new URLSearchParams({ period });
    if (office !== "all") params.set("office_id", office);
    params.set(key, value);
    return `${basePath}/requests?${params}`;
  };
  return {
    new: href("priority", "urgent"),
    inWork: href("status", "execution"),
    completed: href("status", "completed"),
    overdue: href("status", "overdue"),
  };
}
