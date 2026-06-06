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

