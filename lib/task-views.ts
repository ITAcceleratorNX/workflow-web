import { toAppDateKey } from "@/lib/dateTimeUtils";
import type { UserTask } from "@/lib/user-tasks-api";

export type TaskMainView = "inbox" | "today" | "upcoming" | "completed";

export interface TaskSection {
  id: string;
  title: string;
  tasks: UserTask[];
}

function deadlineToDateKey(deadlineTo: UserTask["deadline_to"]): string | null {
  if (deadlineTo == null || deadlineTo === "") return null;
  if (typeof deadlineTo === "string") return deadlineTo.slice(0, 10);
  return toAppDateKey(deadlineTo) || null;
}

/** Current «Срок» field, with a fallback for legacy deadlines regardless of inbox. */
export function taskDueDayKey(task: UserTask): string | null {
  return task.scheduled_at ? toAppDateKey(task.scheduled_at) : deadlineToDateKey(task.deadline_to);
}

function effectiveSortTime(t: UserTask): number {
  if (t.scheduled_at) return new Date(t.scheduled_at).getTime();
  if (t.inbox && t.deadline_to) {
    const dk = deadlineToDateKey(t.deadline_to);
    if (!dk) return 0;
    if (typeof t.deadline_time === "string" && /^\d{1,2}:\d{2}$/.test(t.deadline_time)) {
      const [h, m] = t.deadline_time.split(":");
      return new Date(`${dk}T${String(h).padStart(2, "0")}:${m}:00`).getTime();
    }
    return new Date(`${dk}T12:00:00`).getTime();
  }
  return 0;
}

function sortByScheduleThenTitle(a: UserTask, b: UserTask): number {
  const priorityWeight = (p?: string) => (p === "high" ? 3 : p === "medium" ? 2 : 1);
  const pa = priorityWeight(a.priority);
  const pb = priorityWeight(b.priority);
  if (pa !== pb) return pb - pa;
  const ta = effectiveSortTime(a);
  const tb = effectiveSortTime(b);
  if (ta !== tb) return ta - tb;
  return a.title.localeCompare(b.title, "ru");
}

/** All active tasks, preserving the server order. */
export function getInboxTasks(tasks: UserTask[]): UserTask[] {
  return tasks.filter((task) => !task.completed);
}

export function getTodaySections(tasks: UserTask[], todayKey: string, preserveOrder = false): TaskSection[] {
  const todayTasks = tasks.filter((task) => !task.completed && taskDueDayKey(task) === todayKey);
  if (!preserveOrder) todayTasks.sort(sortByScheduleThenTitle);
  return todayTasks.length ? [{ id: "today", title: "Сегодня", tasks: todayTasks }] : [];
}

export const MONTHS_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

export function formatSectionDateLabel(dateKey: string, todayKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  if (dateKey === todayKey) return "Сегодня";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  if (dateKey === yKey) return "Вчера";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  if (dateKey === tKey) return "Завтра";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
