"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { TaskAssignmentBadges } from "@/components/tasks/task-assignment-badges";
import { useCalendarTasks } from "@/hooks/use-calendar-tasks";
import { useThemeColor } from "@/hooks/use-theme-color";
import { formatTaskTime, getAlmatyHour, toAppDateKey } from "@/lib/dateTimeUtils";
import type { CalendarTask } from "@/lib/user-tasks-api";
import { useAuthStore } from "@/stores/useAuthStore";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const CHECK_ORANGE = "#EA580C";

type ViewMode = "day" | "week" | "month";

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

/** Календарный вид задач — parity с workflow-mobile CalendarTab. */
export function CalendarTab() {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const primary = useThemeColor("primary");
  const text = useThemeColor("text");
  const textMuted = useThemeColor("textMuted");
  const cardBg = useThemeColor("cardBackground");
  const border = useThemeColor("border");

  const { start, end } = useMemo(() => {
    if (viewMode === "day") return { start: selectedDate, end: selectedDate };
    if (viewMode === "week") return getWeekRange(selectedDate);
    return getMonthRange(selectedDate);
  }, [selectedDate, viewMode]);

  const { tasks, loading, toggleComplete, togglingTaskIds } = useCalendarTasks(start, end);

  const formatNavLabel = useCallback(() => {
    const d = selectedDate;
    const today = new Date();
    const dateStr = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    if (d.toDateString() === today.toDateString()) return `Сегодня – ${dateStr}`;
    return dateStr;
  }, [selectedDate]);

  const prev = () => {
    const d = new Date(selectedDate);
    if (viewMode === "day") d.setDate(d.getDate() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setSelectedDate(d);
  };

  const next = () => {
    const d = new Date(selectedDate);
    if (viewMode === "day") d.setDate(d.getDate() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setSelectedDate(d);
  };

  const openTaskDetails = useCallback(
    (task: CalendarTask) => {
      if (task?.id == null) return;
      router.push(`/client/tasks/${task.id}`);
    },
    [router],
  );

  const tasksByHour = useMemo(() => {
    const map: Record<number, CalendarTask[]> = {};
    for (let h = 0; h < 24; h++) map[h] = [];
    const dateKey = toAppDateKey(selectedDate);
    for (const t of tasks) {
      const d = new Date(t.scheduled_at);
      if (toAppDateKey(d) !== dateKey) continue;
      const hour = getAlmatyHour(d);
      if (map[hour] != null) map[hour].push(t);
    }
    return map;
  }, [tasks, selectedDate]);

  const firstHourWithTasks = useMemo(() => {
    for (let h = 0; h < 24; h++) {
      if (tasksByHour[h]?.length > 0) return h;
    }
    return null;
  }, [tasksByHour]);

  const dayScrollRef = useRef<HTMLDivElement>(null);
  const hourRowRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (loading || viewMode !== "day") return;
    const t = setTimeout(() => {
      const el = dayScrollRef.current;
      if (!el) return;
      if (firstHourWithTasks === null) {
        el.scrollTop = 0;
        return;
      }
      const row = hourRowRefs.current[firstHourWithTasks];
      const y = row?.offsetTop ?? firstHourWithTasks * 56;
      el.scrollTop = Math.max(0, y - 12);
    }, 64);
    return () => clearTimeout(t);
  }, [loading, viewMode, selectedDate, firstHourWithTasks, tasks]);

  const renderTaskToggle = useCallback(
    (task: CalendarTask) => {
      const isToggling = togglingTaskIds.includes(task.id);
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void toggleComplete(task);
          }}
          disabled={isToggling}
          className="shrink-0 w-6 h-6 flex items-center justify-center min-h-11 min-w-11"
          aria-label={task.completed ? "Снять выполнение" : "Отметить выполненной"}
        >
          <span
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
            style={{
              borderColor: task.completed ? CHECK_ORANGE : textMuted,
              backgroundColor: task.completed ? CHECK_ORANGE : "transparent",
              opacity: isToggling ? 0.7 : 1,
            }}
          >
            {task.completed ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
          </span>
        </button>
      );
    },
    [toggleComplete, togglingTaskIds, textMuted],
  );

  const sortedRangeTasks = useMemo(
    () =>
      [...tasks].sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
      ),
    [tasks],
  );

  const renderRangeTask = (task: CalendarTask) => (
    <button
      key={task.id}
      type="button"
      onClick={() => openTaskDetails(task)}
      className="w-full text-left p-3 rounded-[10px] mb-2 border min-h-11"
      style={{
        backgroundColor: task.completed ? "rgba(148,163,184,0.14)" : cardBg,
        borderColor: task.completed ? "rgba(148,163,184,0.45)" : border,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex-1 min-w-0 text-[15px] font-medium truncate ${
            task.completed ? "line-through" : ""
          }`}
          style={{ color: task.completed ? textMuted : text }}
        >
          {task.title}
        </span>
        {renderTaskToggle(task)}
      </div>
      <p className="text-xs mt-1" style={{ color: textMuted }}>
        {formatTaskTime(task.scheduled_at)} • {toAppDateKey(task.scheduled_at)}
      </p>
      <TaskAssignmentBadges task={task} primary={primary} currentUserId={currentUserId} compact />
    </button>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b shrink-0"
        style={{ borderColor: border }}
      >
        <button type="button" onClick={prev} className="p-2 min-h-11 min-w-11" aria-label="Назад">
          <ChevronLeft className="h-6 w-6" style={{ color: text }} />
        </button>
        <span className="text-[15px] font-semibold capitalize" style={{ color: text }}>
          {formatNavLabel()}
        </span>
        <button type="button" onClick={next} className="p-2 min-h-11 min-w-11" aria-label="Вперёд">
          <ChevronRight className="h-6 w-6" style={{ color: text }} />
        </button>
      </div>

      <div
        className="flex gap-2 px-3 py-2 border-b shrink-0"
        style={{ borderColor: border }}
      >
        {(["day", "week", "month"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium min-h-9"
            style={{
              backgroundColor: viewMode === mode ? primary : "transparent",
              color: viewMode === mode ? "#fff" : textMuted,
            }}
          >
            {mode === "day" ? "День" : mode === "week" ? "Неделя" : "Месяц"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: primary }} />
        </div>
      ) : viewMode === "day" ? (
        <div ref={dayScrollRef} className="flex-1 overflow-y-auto min-h-0">
          {HOURS.map((hour) => (
            <div
              key={hour}
              ref={(el) => {
                hourRowRefs.current[hour] = el;
              }}
              className="flex min-h-12 border-b px-3 py-1"
              style={{ borderColor: border }}
            >
              <span className="w-11 shrink-0 text-xs pt-1" style={{ color: textMuted }}>
                {hour.toString().padStart(2, "0")}:00
              </span>
              <div className="flex-1 flex flex-col gap-1">
                {tasksByHour[hour]?.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => openTaskDetails(task)}
                    className="text-left rounded-lg px-2.5 py-1.5 min-h-11"
                    style={{
                      backgroundColor: task.completed
                        ? "rgba(148,163,184,0.26)"
                        : `${primary}80`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex-1 text-sm font-medium truncate text-white ${
                          task.completed ? "line-through" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                      {renderTaskToggle(task)}
                    </div>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: task.completed ? "#CBD5E1" : textMuted }}
                    >
                      {formatTaskTime(task.scheduled_at)}
                    </p>
                    <TaskAssignmentBadges
                      task={task}
                      primary={primary}
                      currentUserId={currentUserId}
                      compact
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "week" ? (
        <div className="flex-1 overflow-y-auto min-h-0 p-3">
          {sortedRangeTasks.map(renderRangeTask)}
          {tasks.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: textMuted }}>
              Нет задач на эту неделю
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 p-3">
          {sortedRangeTasks.map(renderRangeTask)}
          {tasks.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: textMuted }}>
              Нет задач на этот месяц
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
