export type RecurrenceType = "none" | "daily" | "weekly" | "weekdays" | "monthly" | "custom";
export type RecurrenceCustomUnit = "day" | "week" | "month";

export interface TaskRecurrencePayload {
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_custom_unit: RecurrenceCustomUnit | null;
  recurrence_weekdays: number[] | null;
}

export function defaultRecurrenceNone(): TaskRecurrencePayload {
  return {
    recurrence_type: "none",
    recurrence_interval: 1,
    recurrence_custom_unit: null,
    recurrence_weekdays: null,
  };
}

export function normalizeRecurrenceFromApi(
  raw: Partial<TaskRecurrencePayload> | null | undefined,
): TaskRecurrencePayload {
  const t = (raw?.recurrence_type as RecurrenceType) ?? "none";
  const allowed: RecurrenceType[] = ["none", "daily", "weekly", "weekdays", "monthly", "custom"];
  const type = allowed.includes(t) ? t : "none";
  let interval = Number(raw?.recurrence_interval);
  if (!Number.isFinite(interval) || interval < 1) interval = 1;
  if (interval > 365) interval = 365;
  const cu = raw?.recurrence_custom_unit;
  const customUnit = cu === "day" || cu === "week" || cu === "month" ? cu : null;
  let wds = raw?.recurrence_weekdays;
  if (!Array.isArray(wds)) wds = null;
  else {
    wds = [...new Set(wds.map((x) => Number(x)).filter((n) => n >= 1 && n <= 7))].sort(
      (a, b) => a - b,
    );
    if (wds.length === 0) wds = null;
  }
  return {
    recurrence_type: type,
    recurrence_interval: interval,
    recurrence_custom_unit: customUnit,
    recurrence_weekdays: wds,
  };
}
