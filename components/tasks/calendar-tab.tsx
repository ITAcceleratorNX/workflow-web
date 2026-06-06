"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toAppDateKey, formatTaskTime } from "@/lib/dateTimeUtils";
import { useCalendarTasks } from "@/hooks/use-calendar-tasks";

const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** Календарный вид задач — упрощённый parity с workflow-mobile CalendarTab (день). */
export function CalendarTab() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const { tasks, loading, toggleComplete, togglingTaskIds } = useCalendarTasks(
    selectedDate,
    selectedDate,
  );

  const dayTasks = useMemo(() => {
    const key = toAppDateKey(selectedDate);
    return tasks
      .filter((t) => t.scheduled_at && toAppDateKey(t.scheduled_at) === key)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [tasks, selectedDate]);

  const navLabel = useMemo(() => {
    const d = selectedDate;
    const today = new Date();
    const dateStr = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    if (d.toDateString() === today.toDateString()) return `Сегодня – ${dateStr}`;
    return dateStr;
  }, [selectedDate]);

  const shiftDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  return (
    <div className="flex-1 px-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => shiftDay(-1)} className="p-2 rounded-full bg-[#2C2C2E]">
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <span className="text-base font-bold text-white capitalize">{navLabel}</span>
        <button type="button" onClick={() => shiftDay(1)} className="p-2 rounded-full bg-[#2C2C2E]">
          <ChevronRight className="h-5 w-5 text-white" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#E25B21]" />
        </div>
      ) : dayTasks.length === 0 ? (
        <p className="text-center text-[#8E8E93] py-12">Нет задач на этот день</p>
      ) : (
        <div className="space-y-2">
          {dayTasks.map((task) => {
            const toggling = togglingTaskIds.includes(task.id);
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-[14px] border border-[#3A3A3C] bg-[#2C2C2E] px-3.5 py-3"
              >
                <button
                  type="button"
                  disabled={toggling}
                  onClick={() => void toggleComplete(task)}
                  className={`w-[22px] h-[22px] rounded-full border-2 shrink-0 ${
                    task.completed ? "bg-[#E25B21] border-[#E25B21]" : "border-[#3A3A3C]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => router.push(`/client/tasks/${task.id}`)}
                  className="flex-1 text-left min-w-0"
                >
                  <p
                    className={`text-base font-medium ${
                      task.completed ? "text-[#8E8E93] line-through" : "text-white"
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-[13px] text-[#8E8E93] mt-0.5">
                    {formatTaskTime(task.scheduled_at)}
                  </p>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
