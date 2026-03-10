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

