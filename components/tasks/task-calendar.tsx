"use client";

import { useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MonthGrid } from "@/components/ui/month-grid";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { useCalendarTasks } from "@/hooks/use-calendar-tasks";
import { toAppDateKey } from "@/lib/dateTimeUtils";
import { monthOfKey, monthRange, monthTitle, sameMonth, shiftMonth, type MonthRef } from "@/lib/month-grid";
import { formatDayShort, formatDayTitle, isTaskOverdue, pluralTasks } from "@/lib/task-due";
import type { CalendarTask, UserTask } from "@/lib/user-tasks-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

type CalendarProps = {
  month: MonthRef;
  onMonthChange: (month: MonthRef) => void;
  day: string;
  onDayChange: (dateKey: string) => void;
  todayKey: string;
  onOpenTask: (task: UserTask) => void;
  onAddForDay: (dateKey: string) => void;
  selectedTaskId?: number | null;
};

const noonUtc = (dateKey: string) => new Date(`${dateKey}T12:00:00.000Z`);

/** Tasks of the visible month grouped by day, ordered by time, with the toggle of the calendar. */
function useMonthTasks(month: MonthRef) {
  const range = useMemo(() => monthRange(month), [month]);
  const start = useMemo(() => noonUtc(range.start), [range.start]);
  const end = useMemo(() => noonUtc(range.end), [range.end]);
  const calendar = useCalendarTasks(start, end);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const task of calendar.tasks) {
      const key = toAppDateKey(task.scheduled_at);
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    for (const list of map.values()) list.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    return map;
  }, [calendar.tasks]);
  return { ...calendar, byDay };
}

function MonthNav({ month, onMonthChange, size }: { month: MonthRef; onMonthChange: (month: MonthRef) => void; size: "sm" | "lg" }) {
  const button = cn(
    "flex items-center justify-center rounded-lg text-ui-fg/60 hover:bg-ui-fg/[0.06] hover:text-ui-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
    size === "lg" ? "size-9" : "size-8",
  );
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="Предыдущий месяц" className={button}>
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <p aria-live="polite" className={cn("min-w-[120px] text-center font-semibold text-ui-fg", size === "lg" ? "text-[17px]" : "text-[15px]")}>
        {monthTitle(month)}
      </p>
      <button type="button" onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Следующий месяц" className={button}>
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  );
}

function dayState(tasks: CalendarTask[] | undefined) {
  const open = (tasks ?? []).filter((task) => !task.completed);
  return { hasOpen: open.length > 0, hasOverdue: open.some((task) => isTaskOverdue(task)) };
}

function selectDay(key: string, props: Pick<CalendarProps, "month" | "onMonthChange" | "onDayChange">) {
  props.onDayChange(key);
  const target = monthOfKey(key);
  if (!sameMonth(target, props.month)) props.onMonthChange(target);
}

function DayTasks({
  tasks,
  loading,
  error,
  onRetry,
  todayKey,
  onToggle,
  onOpenTask,
  density,
  selectedTaskId,
}: {
  tasks: CalendarTask[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  todayKey: string;
  onToggle: (task: CalendarTask) => void;
  onOpenTask: (task: UserTask) => void;
  density: "mobile" | "compact";
  selectedTaskId?: number | null;
}) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  if (loading && tasks.length === 0) {
    return (
      <div role="status" className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin text-ui-accent" aria-label="Загружаем задачи" />
      </div>
    );
  }
  if (error && tasks.length === 0) {
    return (
      <div role="alert" className="flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-sm text-ui-fg/70">{error}</p>
        <button type="button" onClick={onRetry} className="min-h-11 px-3 text-sm font-semibold text-ui-accent">
          Повторить
        </button>
      </div>
    );
  }
  if (tasks.length === 0) return <p className="py-4 text-sm text-ui-fg/50">Задач на этот день нет</p>;
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskListItem
            task={task}
            todayKey={todayKey}
            currentUserId={currentUserId}
            onToggle={() => onToggle(task)}
            onOpen={onOpenTask}
            density={density}
            timeOnly={density === "compact"}
            selected={selectedTaskId === task.id}
          />
        </li>
      ))}
    </ul>
  );
}

/** Phone calendar (Figma «Задачи — режим календаря»): the month with marks, then the tasks of the day. */
export function TaskCalendarMobile(props: CalendarProps) {
  const { month, onMonthChange, day, todayKey, onOpenTask } = props;
  const { byDay, loading, error, refresh, toggleComplete } = useMonthTasks(month);
  const dayTasks = byDay.get(day) ?? [];

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold leading-[31px] text-ui-fg">Задачи</h1>
        <MonthNav month={month} onMonthChange={onMonthChange} size="sm" />
      </div>
      <div className="rounded-2xl bg-ui-surface px-1.5 pb-2 pt-2.5">
        <MonthGrid
          month={month}
          focusKey={day}
          weekClassName="gap-y-0.5"
          renderDay={(cell) => {
            const selected = cell.key === day;
            const { hasOpen, hasOverdue } = dayState(byDay.get(cell.key));
            return (
              <button
                type="button"
                data-date={cell.key}
                tabIndex={cell.tabIndex}
                aria-pressed={selected}
                aria-label={`${formatDayShort(cell.key)}${cell.key === todayKey ? ", сегодня" : ""}${hasOpen ? ", есть задачи" : ""}`}
                onClick={() => selectDay(cell.key, props)}
                className={cn(
                  "mx-auto flex h-[33px] w-full max-w-[50px] flex-col items-center justify-center gap-0.5 rounded-[10px] text-[15px] leading-[18px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
                  selected ? "bg-ui-accent font-semibold text-ui-fg" : "text-ui-fg hover:bg-ui-fg/[0.06]",
                  !selected && cell.key === todayKey && "font-semibold text-ui-accent",
                )}
              >
                {cell.day}
                <span
                  aria-hidden
                  className={cn(
                    "size-1 rounded-full",
                    !hasOpen ? "bg-transparent" : selected ? "bg-ui-fg" : hasOverdue ? "bg-ui-danger" : "bg-ui-accent",
                  )}
                />
              </button>
            );
          }}
        />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ui-fg/50">{formatDayTitle(day)}</p>
      <DayTasks
        tasks={dayTasks}
        loading={loading}
        error={error}
        onRetry={() => void refresh()}
        todayKey={todayKey}
        onToggle={(task) => void toggleComplete(task)}
        onOpenTask={onOpenTask}
        density="mobile"
      />
    </div>
  );
}

const MAX_CHIPS = 2;

/** Desktop calendar (Figma «Задачи - режим календаря»): a month of cells with tasks and the day panel. */
export function TaskCalendarDesktop(props: CalendarProps) {
  const { month, onMonthChange, day, todayKey, onOpenTask, onAddForDay, selectedTaskId } = props;
  const { byDay, loading, error, refresh, toggleComplete } = useMonthTasks(month);
  const dayTasks = byDay.get(day) ?? [];
  const pastDay = day < todayKey;

  return (
    <div className="grid min-h-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section aria-label="Месяц" className="flex flex-col gap-2 rounded-[18px] bg-ui-surface px-4 py-3.5">
        <MonthNav month={month} onMonthChange={onMonthChange} size="lg" />
        <MonthGrid
          month={month}
          focusKey={day}
          className="gap-1.5"
          weekClassName="gap-1.5"
          weekdayClassName="pl-2 text-left text-xs"
          renderDay={(cell) => {
            const tasks = byDay.get(cell.key) ?? [];
            const selected = cell.key === day;
            const shown = tasks.slice(0, MAX_CHIPS);
            return (
              <button
                type="button"
                data-date={cell.key}
                tabIndex={cell.tabIndex}
                aria-pressed={selected}
                aria-label={`${formatDayShort(cell.key)}, ${tasks.length ? pluralTasks(tasks.length) : "задач нет"}`}
                onClick={() => selectDay(cell.key, props)}
                className={cn(
                  "flex h-24 w-full flex-col gap-1 overflow-hidden rounded-[10px] border pb-1.5 pl-2 pr-1.5 pt-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
                  selected ? "border-ui-accent bg-ui-accent-soft" : "border-transparent bg-ui-fg/[0.03] hover:bg-ui-fg/[0.06]",
                )}
              >
                <span
                  className={cn(
                    "text-[13px] leading-4",
                    selected || cell.key === todayKey ? "font-semibold text-ui-accent-on-soft" : "text-ui-fg/85",
                  )}
                >
                  {cell.day}
                </span>
                {shown.map((task) => {
                  const overdue = isTaskOverdue(task);
                  return (
                    <span
                      key={task.id}
                      title={task.title}
                      className={cn(
                        "truncate rounded-[5px] px-1.5 py-0.5 text-[11px] font-medium leading-[13px]",
                        task.completed
                          ? "bg-ui-fg/[0.06] text-ui-fg/45 line-through"
                          : overdue
                            ? "bg-ui-danger/20 text-ui-danger"
                            : selected
                              ? "bg-ui-accent/20 text-ui-accent-on-soft"
                              : "bg-ui-fg/[0.08] text-ui-fg/85",
                      )}
                    >
                      {task.title}
                    </span>
                  );
                })}
                {tasks.length > MAX_CHIPS ? (
                  <span className="px-1.5 text-[11px] text-ui-fg/50">ещё {tasks.length - MAX_CHIPS}</span>
                ) : null}
              </button>
            );
          }}
        />
      </section>
      <section aria-label={formatDayTitle(day)} className="flex flex-col gap-2.5 rounded-[18px] bg-ui-surface p-[18px]">
        <div>
          <h2 className="text-lg font-bold leading-[21px] text-ui-fg">{formatDayTitle(day)}</h2>
          <p className="mt-1 text-[13px] text-ui-fg/50">{loading && dayTasks.length === 0 ? "Загружаем…" : pluralTasks(dayTasks.length)}</p>
        </div>
        {dayTasks.length === 0 && !loading && !error ? (
          <EmptyState className="py-6" icon={<CalendarDays />} title="Задач нет" description="На этот день ничего не запланировано" />
        ) : (
          <DayTasks
            tasks={dayTasks}
            loading={loading}
            error={error}
            onRetry={() => void refresh()}
            todayKey={todayKey}
            onToggle={(task) => void toggleComplete(task)}
            onOpenTask={onOpenTask}
            density="compact"
            selectedTaskId={selectedTaskId}
          />
        )}
        {!pastDay ? (
          <button
            type="button"
            onClick={() => onAddForDay(day)}
            className="flex min-h-[39px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-ui-accent/70 text-sm font-semibold text-ui-accent-on-soft transition-colors hover:bg-ui-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
          >
            <Plus className="size-4" aria-hidden />
            Задача на {formatDayShort(day)}
          </button>
        ) : null}
      </section>
    </div>
  );
}
