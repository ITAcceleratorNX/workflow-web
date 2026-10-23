import type { ManagerStatsRawItem } from "@/lib/manager-stats-api";

/**
 * Период статистики Руководителя. Одно правило для главной, статистики, экспорта и
 * списка заявок (см. getPeriodStartDate в request-utils): неделя — 7 дней назад,
 * месяц и год — с того же числа месяц/год назад; «свои даты» — включительно.
 */
export type ManagerStatsPeriod = "week" | "month" | "year" | "custom";

export interface ManagerStatsRange {
  from: Date;
  to: Date;
  /** ГГГГ-ММ-ДД — для сравнения с ключами дней из API и параметров from/to. */
  fromKey: string;
  toKey: string;
}

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function managerPeriodStart(period: Exclude<ManagerStatsPeriod, "custom">, now = new Date()): Date {
  if (period === "week") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === "month") return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
}

export function managerStatsRange(
  period: ManagerStatsPeriod,
  custom?: { from?: Date; to?: Date },
  now = new Date(),
): ManagerStatsRange {
  if (period === "custom" && custom?.from && custom.to) {
    return { from: custom.from, to: custom.to, fromKey: dateKey(custom.from), toKey: dateKey(custom.to) };
  }
  const from = managerPeriodStart(period === "custom" ? "month" : period, now);
  return { from, to: now, fromKey: dateKey(from), toKey: dateKey(now) };
}

/** «15–21 октября 2026», «21 сентября – 21 октября 2026», «21 октября 2025 – 21 октября 2026». */
export function formatRangeLabel(fromKey: string, toKey: string): string {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  const toText = `${to.getDate()} ${MONTHS_GENITIVE[to.getMonth()]} ${to.getFullYear()}`;
  if (fromKey === toKey) return toText;
  if (from.getFullYear() !== to.getFullYear()) {
    return `${from.getDate()} ${MONTHS_GENITIVE[from.getMonth()]} ${from.getFullYear()} – ${toText}`;
  }
  if (from.getMonth() !== to.getMonth()) {
    return `${from.getDate()} ${MONTHS_GENITIVE[from.getMonth()]} – ${toText}`;
  }
  return `${from.getDate()}–${toText}`;
}

export function formatShortDay(key: string): string {
  const date = parseDateKey(key);
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()].slice(0, 3)}`;
}

/** Все дни диапазона включительно. */
export function eachDayKey(fromKey: string, toKey: string): string[] {
  const days: string[] = [];
  const cursor = parseDateKey(fromKey);
  const end = parseDateKey(toKey);
  while (cursor <= end && days.length < 400) {
    days.push(dateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function isInRange(key: string, range: Pick<ManagerStatsRange, "fromKey" | "toKey">): boolean {
  return key >= range.fromKey && key <= range.toKey;
}

/** KPI «Заявки за месяц» на главной Руководителя. */
export function calculateManagerHomeKpi(
  stats: ManagerStatsRawItem[],
  office: string,
  period: string,
  now = new Date(),
) {
  const fromDay = period === "week" || period === "month" || period === "year"
    ? dateKey(managerPeriodStart(period, now))
    : "";
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
