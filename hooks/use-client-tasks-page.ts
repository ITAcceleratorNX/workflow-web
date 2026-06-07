"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addCalendarDaysToDateKey,
  todayTaskDateKey,
} from "@/lib/dateTimeUtils";
import {
  formatSectionDateLabel,
  getTodaySections,
  type TaskMainView,
} from "@/lib/task-views";
import { useTodoList, type UseTodoListQuery } from "@/hooks/use-todo-list";
import type { UserTask } from "@/lib/user-tasks-api";

const VIEW_TABS: { value: TaskMainView; label: string }[] = [
  { value: "inbox", label: "Входящие" },
  { value: "today", label: "Сегодня" },
  { value: "upcoming", label: "Предстоящие" },
  { value: "completed", label: "Выполненные" },
];

/** Полоса «Предстоящие» — только будущие дни (с завтра), сегодня в «Сегодня». */
const UPCOMING_CALENDAR_DAYS_FORWARD = 180;
const COMPLETED_CALENDAR_DAYS_HISTORY = UPCOMING_CALENDAR_DAYS_FORWARD;

const WEEKDAY_SHORT_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTH_SHORT_RU = [
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

export type TaskSectionRow = { title: string; data: UserTask[]; sectionId: string };
export type CalendarStripDay = { key: string; dayNumber: number; weekdayLabel: string };

function parseMainView(params: {
  tab?: string | null;
  filter?: string | null;
  date?: string | null;
}): TaskMainView {
  const t = params.tab;
  if (t === "inbox" || t === "today" || t === "upcoming" || t === "completed") return t;
  const filter = params.filter;
  const date = params.date;
  if (filter === "today" || date === "today") return "today";
  if (filter === "overdue") return "today";
  if (filter === "all") return "inbox";
  return "inbox";
}

function weekdayShortRuForDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return "";
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return WEEKDAY_SHORT_RU[wd];
}

export function useClientTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramTab = searchParams.get("tab");
  const paramFilter = searchParams.get("filter");
  const paramDate = searchParams.get("date");
  const paramView = searchParams.get("view");

  const [mainView, setMainView] = useState<TaskMainView>(() =>
    parseMainView({ tab: paramTab, filter: paramFilter, date: paramDate }),
  );
  const [viewMode, setViewMode] = useState<"list" | "calendar">(() =>
    paramView === "calendar" ? "calendar" : "list",
  );
  const [upcomingDate, setUpcomingDate] = useState<string | null>(null);
  const [upcomingVisibleDateKey, setUpcomingVisibleDateKey] = useState<string | null>(null);
  const [completedDateKey, setCompletedDateKey] = useState<string>(() => todayTaskDateKey());
  const [completedVisibleDateKey, setCompletedVisibleDateKey] = useState<string | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);

  const todayKey = todayTaskDateKey();
  const tomorrowKey = useMemo(() => addCalendarDaysToDateKey(todayKey, 1), [todayKey]);

  useEffect(() => {
    setMainView(parseMainView({ tab: paramTab, filter: paramFilter, date: paramDate }));
  }, [paramTab, paramFilter, paramDate]);

  useEffect(() => {
    if (paramView === "calendar") setViewMode("calendar");
    else setViewMode("list");
  }, [paramView]);

  const todoListQuery = useMemo((): UseTodoListQuery => {
    if (viewMode === "calendar") {
      return { view: "inbox", enabled: false };
    }
    switch (mainView) {
      case "inbox":
        return { view: "inbox", light: true };
      case "today":
        return { view: "list_today", today: todayKey, light: true };
      case "upcoming": {
        const day = upcomingDate ?? tomorrowKey;
        return {
          view: "list_upcoming",
          today: todayKey,
          fromDate: day,
          toDate: day,
          light: true,
        };
      }
      case "completed":
        return { view: "list_completed", completedOn: completedDateKey, light: true };
      default:
        return { view: "inbox", light: true };
    }
  }, [mainView, todayKey, upcomingDate, tomorrowKey, completedDateKey, viewMode]);

  const todo = useTodoList(todoListQuery);
  const { tasks, toggleComplete, loading: loadingTasks, loadingMore, hasMore, loadMore, addTask } =
    todo;

  useEffect(() => {
    if (upcomingDate) return;
    setUpcomingDate(tomorrowKey);
  }, [upcomingDate, tomorrowKey]);

  useEffect(() => {
    if (upcomingVisibleDateKey) return;
    setUpcomingVisibleDateKey(upcomingDate ?? tomorrowKey);
  }, [upcomingVisibleDateKey, upcomingDate, tomorrowKey]);

  const upcomingStripDays = useMemo((): CalendarStripDay[] => {
    return Array.from({ length: UPCOMING_CALENDAR_DAYS_FORWARD + 1 }, (_, idx) => {
        const dayOffset = idx + 1;
        const key = addCalendarDaysToDateKey(todayKey, dayOffset);
        const dayPart = key.split("-")[2];
        const dayNumber = dayPart ? parseInt(dayPart, 10) : 1;
        return {
          key,
          dayNumber: Number.isFinite(dayNumber) ? dayNumber : 1,
          weekdayLabel: weekdayShortRuForDateKey(key),
        };
      },
    );
  }, [todayKey]);

  const completedStripDays = useMemo((): CalendarStripDay[] => {
    const n = COMPLETED_CALENDAR_DAYS_HISTORY;
    return Array.from({ length: n + 1 }, (_, idx) => {
      const offset = idx - n;
      const key = addCalendarDaysToDateKey(todayKey, offset);
      const dayPart = key.split("-")[2];
      const dayNumber = dayPart ? parseInt(dayPart, 10) : 1;
      return {
        key,
        dayNumber: Number.isFinite(dayNumber) ? dayNumber : 1,
        weekdayLabel: weekdayShortRuForDateKey(key),
      };
    });
  }, [todayKey]);

  const upcomingMonthLabel = useMemo(() => {
    const selected = new Date(`${upcomingVisibleDateKey ?? upcomingDate ?? tomorrowKey}T12:00:00`);
    return `${MONTH_SHORT_RU[selected.getMonth()]}. ${selected.getFullYear()}`;
  }, [upcomingVisibleDateKey, upcomingDate, tomorrowKey]);

  const completedMonthLabel = useMemo(() => {
    const selected = new Date(`${completedVisibleDateKey ?? completedDateKey}T12:00:00`);
    return `${MONTH_SHORT_RU[selected.getMonth()]}. ${selected.getFullYear()}`;
  }, [completedVisibleDateKey, completedDateKey]);

  const sections = useMemo((): TaskSectionRow[] => {
    if (mainView === "completed") {
      if (tasks.length === 0) return [];
      return [{ title: "", data: tasks, sectionId: "completed" }];
    }
    if (mainView === "inbox") {
      if (tasks.length === 0) return [];
      return [{ title: "Входящие", data: tasks, sectionId: "inbox" }];
    }
    if (mainView === "today") {
      return getTodaySections(tasks, todayKey).map((s) => ({
        title: s.title,
        data: s.tasks,
        sectionId: s.id,
      }));
    }
    const day = upcomingDate ?? tomorrowKey;
    if (tasks.length === 0) return [];
    return [
      {
        title: formatSectionDateLabel(day, todayKey),
        data: tasks,
        sectionId: `day-${day}`,
      },
    ];
  }, [tasks, mainView, todayKey, upcomingDate, tomorrowKey]);

  const emptyCopy = useMemo(() => {
    if (mainView === "completed") {
      return {
        title: "Нет выполненных за этот день",
        subtitle: "Выберите другую дату в полосе календаря выше",
      };
    }
    if (mainView === "inbox") {
      return {
        title: "Входящие пусты",
        subtitle: "Добавьте задачу — без срока или с датой, она останется во входящих",
      };
    }
    if (mainView === "today") {
      return {
        title: "На сегодня всё сделано",
        subtitle: "Нет просроченных и запланированных на сегодня задач",
      };
    }
    return {
      title: "Нет предстоящих задач",
      subtitle: "Запланируйте задачу на будущие дни",
    };
  }, [mainView]);

  const setMainViewWithUrl = useCallback(
    (view: TaskMainView) => {
      setMainView(view);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", view);
      router.replace(`/client/tasks?${params.toString()}`);
    },
    [router, searchParams],
  );

  const applyLayout = useCallback(
    (mode: "list" | "calendar") => {
      setViewMode(mode);
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", mode);
      router.replace(`/client/tasks?${params.toString()}`);
      setDisplayMenuOpen(false);
    },
    [router, searchParams],
  );

  const openTaskStats = useCallback(() => {
    setDisplayMenuOpen(false);
    router.push("/client/statistics");
  }, [router]);

  return {
    viewTabs: VIEW_TABS,
    mainView,
    setMainView: setMainViewWithUrl,
    viewMode,
    applyLayout,
    todayKey,
    tomorrowKey,
    upcomingDate,
    setUpcomingDate,
    upcomingVisibleDateKey,
    setUpcomingVisibleDateKey,
    upcomingStripDays,
    upcomingMonthLabel,
    completedDateKey,
    setCompletedDateKey,
    completedVisibleDateKey,
    setCompletedVisibleDateKey,
    completedStripDays,
    completedMonthLabel,
    sections,
    emptyCopy,
    loadingTasks,
    loadingMore,
    hasMore,
    loadMore,
    toggleComplete,
    addTask,
    addSheetOpen,
    setAddSheetOpen,
    displayMenuOpen,
    setDisplayMenuOpen,
    openTaskStats,
  };
}

export type UseClientTasksPageResult = ReturnType<typeof useClientTasksPage>;
