export const NEWS_DATE_FILTER_OPTIONS = [
  { value: "all", label: "Все даты" },
  { value: "today", label: "Сегодня" },
  { value: "week", label: "За неделю" },
  { value: "month", label: "За месяц" },
] as const;

export type NewsDateFilter = (typeof NEWS_DATE_FILTER_OPTIONS)[number]["value"];

const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export function formatNewsDisplayDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
