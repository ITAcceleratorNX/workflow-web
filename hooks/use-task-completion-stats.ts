"use client";

import { useCallback, useEffect, useState } from "react";
import { addDaysToDateKey, toAppDateKey } from "@/lib/dateTimeUtils";
import {
  getTodayStats,
  getUserTasksCalendar,
  type CalendarTask,
} from "@/lib/user-tasks-api";
import { useAuthStore } from "@/stores/useAuthStore";

function getWeekRange(ref: Date): { start: Date; end: Date } {
  const d = new Date(ref);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}

function getMonthRange(ref: Date): { start: Date; end: Date } {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { start, end };
}

function aggregateRange(tasks: CalendarTask[], startKey: string, endKey: string) {
  let total = 0;
  let completed = 0;
  for (const task of tasks) {
    if (!task.scheduled_at) continue;
    const key = toAppDateKey(task.scheduled_at);
    if (key >= startKey && key <= endKey) {
      total += 1;
      if (task.completed) completed += 1;
    }
  }
  return { completed, total };
}

/** Агрегаты «выполнено из запланированных» — parity с workflow-mobile. */
export function useTaskCompletionStats(enabled: boolean) {
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [weekCompleted, setWeekCompleted] = useState(0);
  const [weekTotal, setWeekTotal] = useState(0);
  const [monthCompleted, setMonthCompleted] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const token = useAuthStore((s) => s.token);

  const load = useCallback(async () => {
    if (!token) {
      setTodayCompleted(0);
      setTodayTotal(0);
      setWeekCompleted(0);
      setWeekTotal(0);
      setMonthCompleted(0);
      setMonthTotal(0);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const weekRange = getWeekRange(now);
      const monthRange = getMonthRange(now);
      const weekStart = toAppDateKey(weekRange.start);
      const weekEnd = toAppDateKey(weekRange.end);
      const monthStart = toAppDateKey(monthRange.start);
      const monthEnd = toAppDateKey(monthRange.end);

      const [statsRes, weekCalRes, monthCalRes] = await Promise.all([
        getTodayStats(),
        getUserTasksCalendar(addDaysToDateKey(weekStart, -1), addDaysToDateKey(weekEnd, 1)),
        getUserTasksCalendar(addDaysToDateKey(monthStart, -1), addDaysToDateKey(monthEnd, 1)),
      ]);

      if (statsRes.ok) {
        setTodayCompleted(statsRes.data.todayCompleted);
        setTodayTotal(statsRes.data.todayTotal);
      }

      if (weekCalRes.ok) {
        const week = aggregateRange(weekCalRes.data.tasks, weekStart, weekEnd);
        setWeekCompleted(week.completed);
        setWeekTotal(week.total);
      }

      if (monthCalRes.ok) {
        const month = aggregateRange(monthCalRes.data.tasks, monthStart, monthEnd);
        setMonthCompleted(month.completed);
        setMonthTotal(month.total);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [enabled, load]);

  return {
    todayCompleted,
    todayTotal,
    weekCompleted,
    weekTotal,
    monthCompleted,
    monthTotal,
    loading,
    refresh: load,
  };
}

export type UseTaskCompletionStatsResult = ReturnType<typeof useTaskCompletionStats>;

export function taskCompletionRatio(completed: number, total: number): number {
  return total > 0 ? completed / total : 0;
}
