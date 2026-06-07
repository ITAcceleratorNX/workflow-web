export const APP_TIMEZONE = "Asia/Almaty";
export const APP_LOCALE = "ru-RU";

export type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export function formatWithOptions(
  value: DateInput,
  options: Intl.DateTimeFormatOptions
): string {
  const date = toDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    ...options,
  }).format(date);
}

export function formatDateTime(value: DateInput): string {
  return formatWithOptions(value, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Дата и время заявки — alias для formatDateTime (как formatRequestDate в mobile). */
export function formatRequestDate(value: DateInput): string {
  return formatDateTime(value);
}

/** Допуск «чуть в прошлом» для планирования публикации новостей (мс). */
export const NEWS_SCHEDULE_PAST_SLACK_MS = 60_000;

/** Максимум через сколько можно запланировать публикацию (365 суток). */
export const NEWS_SCHEDULE_MAX_LEAD_MS = 365 * 24 * 60 * 60 * 1000;

export function getNewsScheduleMinimumDate(): Date {
  return new Date(Date.now() - NEWS_SCHEDULE_PAST_SLACK_MS);
}

export function getNewsScheduleMaximumDate(): Date {
  return new Date(Date.now() + NEWS_SCHEDULE_MAX_LEAD_MS);
}

export function clampNewsScheduleDate(d: Date): Date {
  const min = getNewsScheduleMinimumDate();
  const max = getNewsScheduleMaximumDate();
  const t = d.getTime();
  if (t < min.getTime()) return new Date(min);
  if (t > max.getTime()) return new Date(max);
  return d;
}

/** Дата и время публикации новости (Asia/Almaty). */
export function formatNewsScheduleDateTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "—";
  const d = formatDateOnly(date);
  const t = formatTimeOnly(date);
  return d && t ? `${d} ${t}` : "—";
}

/** Короткая дата для карточки списка: «15 мар., 14:30» (как workflow-mobile formatCardDateShort). */
export function formatCardDateShort(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "—";
  const datePart = formatWithOptions(date, {
    day: "numeric",
    month: "short",
  });
  const timePart = formatTimeOnly(date);
  return datePart && timePart ? `${datePart}, ${timePart}` : "—";
}

/** Дата из ISO с fallback при ошибке Intl (как в mobile). */
export function formatDisplayDateFromIso(iso: string): string {
  const formatted = formatDateOnly(iso);
  if (formatted) return formatted;
  const part = iso.slice(0, 10);
  if (part.length === 10) return part.split("-").reverse().join(".");
  return iso;
}

/** «только что» / «N мин назад» / «N дн назад» / DD.MM.YYYY */
export function formatTimeAgo(dateStr: string): string {
  const date = toDate(dateStr);
  if (!date) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (totalMinutes < 1) return "только что";
  if (totalMinutes < 60) return `${totalMinutes} мин назад`;
  if (totalMinutes < 60 * 24) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m === 0 ? `${h} ч назад` : `${h} ч ${m} мин назад`;
  }
  if (diffDays < 7) return `${diffDays} дн назад`;

  return formatDateOnly(date) || dateStr;
}

export function formatDateOnly(value: DateInput): string {
  return formatWithOptions(value, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Дата длинным форматом: "15 марта 2025 г." */
export function formatDateLong(value: DateInput): string {
  return formatWithOptions(value, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTimeOnly(value: DateInput): string {
  return formatWithOptions(value, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Backwards-compatible helper used for notifications
export function formatNotificationDateTime(
  dateStr: string | null | undefined
): string {
  return formatDateTime(dateStr);
}

/**
 * Текущая дата в бизнес‑тайзоне приложения (Asia/Almaty) в формате YYYY-MM-DD.
 * Используем отдельный форматтер с локалью en-CA, чтобы сразу получать ISO‑дату.
 */
export function getTodayAppDateISO(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/** Ключ даты YYYY-MM-DD в Asia/Almaty (для user-tasks календаря). */
export function toAppDateKey(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Сдвиг календарной даты YYYY-MM-DD на N дней. */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Дата YYYY-MM-DD для API (локальный календарный день). */
export function formatDateForApi(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Сегодняшний YYYY-MM-DD в Asia/Almaty (списки задач). */
export function todayTaskDateKey(): string {
  return toAppDateKey(new Date());
}

/** Сдвиг календарной даты YYYY-MM-DD на N дней (для «завтра» относительно ключа дня в Almaty). */
export function addCalendarDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return dateKey;
  const t = Date.UTC(y, m - 1, d + days);
  const dt = new Date(t);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function getAlmatyOffsetMinutes(utcDate: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(utcDate);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
    const y = Number(get("year"));
    const m = Number(get("month"));
    const d = Number(get("day"));
    const hh = Number(get("hour"));
    const mm = Number(get("minute"));
    const ss = Number(get("second"));
    const asUtc = Date.UTC(y, m - 1, d, hh, mm, ss);
    return Math.round((asUtc - utcDate.getTime()) / 60000);
  } catch {
    return 300;
  }
}

/** UTC ISO из даты (YYYY-MM-DD) и времени (HH:mm), интерпретируемых как Asia/Almaty. */
export function toUtcIsoFromAppDateTime(dateKey: string, time: string): string {
  const [yS, mS, dS] = (dateKey || "").split("-");
  const [hhS, mmS] = (time || "").split(":");
  const y = Number(yS);
  const m = Number(mS);
  const d = Number(dS);
  const hh = Number(hhS);
  const mm = Number(mmS);
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    !Number.isFinite(hh) ||
    !Number.isFinite(mm)
  ) {
    return new Date().toISOString();
  }
  const asIfUtcMs = Date.UTC(y, m - 1, d, hh, mm, 0);
  const guessUtc = new Date(asIfUtcMs);
  const offsetMin = getAlmatyOffsetMinutes(guessUtc);
  const utcMs = asIfUtcMs - offsetMin * 60000;
  return new Date(utcMs).toISOString();
}

/** Час 0–23 в Asia/Almaty (слоты календаря дня). */
export function getAlmatyHour(value: DateInput): number {
  const date = toDate(value);
  if (!date) return 0;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIMEZONE,
      hour: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === "hour")?.value ?? "0";
    return parseInt(hour, 10) || 0;
  } catch {
    return date.getUTCHours();
  }
}

/** Время HH:mm в Asia/Almaty для задач. */
export function formatTaskTime(value: DateInput): string {
  const formatted = formatTimeOnly(value);
  if (formatted) return formatted;
  const date = toDate(value);
  if (!date) return "";
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

