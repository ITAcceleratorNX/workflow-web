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

function taskScheduledDayKey(t: UserTask): string | null {
  if (t.scheduled_at) return toAppDateKey(t.scheduled_at);
  if (t.inbox) return deadlineToDateKey(t.deadline_to);
  return null;
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

export function getTodaySections(tasks: UserTask[], todayKey: string): TaskSection[] {
  const overdue: UserTask[] = [];
  const todayScheduled: UserTask[] = [];
  const doneToday: UserTask[] = [];

  for (const t of tasks) {
    const dayKey = taskScheduledDayKey(t);
    if (t.inbox && !dayKey) continue;

    if (t.completed) {
      const ref = t.completed_at;
      if (ref && toAppDateKey(ref) === todayKey) {
        doneToday.push(t);
      }
      continue;
    }
    if (!dayKey) continue;
    if (dayKey < todayKey) {
      overdue.push(t);
      continue;
    }
    if (dayKey === todayKey) {
      todayScheduled.push(t);
    }
  }

  overdue.sort(sortByScheduleThenTitle);
  todayScheduled.sort(sortByScheduleThenTitle);
  doneToday.sort((a, b) => {
    const ca = a.completed_at ?? a.updated_at;
    const cb = b.completed_at ?? b.updated_at;
    return cb.localeCompare(ca);
  });

  const sections: TaskSection[] = [];
  if (overdue.length > 0) sections.push({ id: "overdue", title: "Просрочено", tasks: overdue });
  if (todayScheduled.length > 0) sections.push({ id: "today", title: "Сегодня", tasks: todayScheduled });
  if (doneToday.length > 0) sections.push({ id: "done-today", title: "Выполнено", tasks: doneToday });
  return sections;
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
