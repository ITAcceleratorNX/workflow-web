import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { RecurrenceType, RecurringStatus, RecurringTask } from "@/lib/recurring-tasks-api";

export function getRecurrenceTitle(type: RecurrenceType): string {
  switch (type) {
    case "weekly":
      return "Еженедельная задача";
    case "daily":
      return "Ежедневная задача";
    case "monthly":
      return "Ежемесячная задача";
    case "yearly":
      return "Ежегодная задача";
    default:
      return "Повторяющаяся задача";
  }
}

export function getRecurrenceText(type: RecurrenceType | string, interval: number): string {
  switch (type) {
    case "daily":
      return interval === 1 ? "Ежедневно" : `Каждые ${interval} дней`;
    case "weekly":
      return interval === 1 ? "Еженедельно" : `Каждые ${interval} недель`;
    case "monthly":
      return interval === 1 ? "Ежемесячно" : `Каждые ${interval} месяцев`;
    case "yearly":
      return interval === 1 ? "Ежегодно" : `Каждые ${interval} лет`;
    default:
      return `${type} каждые ${interval}`;
  }
}

export function getRecurringStatusLabel(status: RecurringStatus): string {
  switch (status) {
    case "active":
      return "Активна";
    case "paused":
      return "Приостановлена";
    case "completed":
      return "Завершена";
    default:
      return status;
  }
}

export function formatNextDueDate(nextDueDate: string | null | undefined): string {
  if (!nextDueDate) return "Не установлена";
  return format(new Date(nextDueDate), "dd.MM.yyyy", { locale: ru });
}

export function getCleanLocation(location: string): string {
  if (location.includes("Широта:") && location.includes("Долгота:")) {
    const beforeCoords = location.split("Широта:")[0].trim();
    return beforeCoords || "Локация не указана";
  }
  return location;
}

export function getCompletedInstancesCount(task: RecurringTask): number {
  if (!task.taskInstances?.length) return 0;
  return task.taskInstances.filter((i) => i.status === "completed").length;
}
