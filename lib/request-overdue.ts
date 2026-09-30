/** Matches the API's completed-after-SLA definition; month/year intervals use calendar dates. */
export function completedAfterSla(group: {
  status: string;
  date_submitted?: string;
  requests?: { sla?: string; actual_completion_date?: string | null }[];
}): boolean {
  if (group.status !== "completed" || !group.date_submitted) return false;
  const start = new Date(group.date_submitted);
  if (!Number.isFinite(start.getTime())) return false;
  return (group.requests ?? []).some((request) => {
    const match = request.sla?.match(/^(\d+(?:\.\d+)?)(h|d|w|m|y)$/);
    if (!match || !request.actual_completion_date) return false;
    const value = Number(match[1]);
    const unit = match[2];
    const deadline = new Date(start);
    if (unit === "m" || unit === "y") {
      const day = deadline.getUTCDate();
      deadline.setUTCDate(1);
      deadline.setUTCMonth(deadline.getUTCMonth() + value * (unit === "y" ? 12 : 1));
      const lastDay = new Date(Date.UTC(deadline.getUTCFullYear(), deadline.getUTCMonth() + 1, 0)).getUTCDate();
      deadline.setUTCDate(Math.min(day, lastDay));
    } else {
      deadline.setTime(start.getTime() + value * (unit === "h" ? 1 : unit === "d" ? 24 : 168) * 3600000);
    }
    return new Date(request.actual_completion_date).getTime() > deadline.getTime();
  });
}
