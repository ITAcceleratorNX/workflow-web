"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addCalendarDaysToDateKey, todayTaskDateKey } from "@/lib/dateTimeUtils";
import type { TaskMainView } from "@/lib/task-views";
import { formatDayHeading, formatDueDay, pluralTasks, pluralUnfinished } from "@/lib/task-due";
import { taskSortQuery, type TaskSort } from "@/lib/task-list-sort";
import { monthOfKey, type MonthRef } from "@/lib/month-grid";
import { useTodoList, type UseTodoListQuery } from "@/hooks/use-todo-list";
import { useCurrentTaskDay } from "@/hooks/use-current-task-day";
import { useTaskCounts } from "@/hooks/use-task-counts";
import { useTaskSortPreference } from "@/hooks/use-task-sort-preference";
import type { UserTask } from "@/lib/user-tasks-api";

export type TaskLayoutMode = "list" | "calendar";

export const TASK_VIEW_TABS: readonly { value: TaskMainView; label: string }[] = [
  { value: "inbox", label: "Входящие" },
  { value: "today", label: "Сегодня" },
  { value: "upcoming", label: "Предстоящие" },
  { value: "completed", label: "Выполненные" },
];

/** «Предстоящие» — days from tomorrow; «Выполненные» — the same span back from today. */
const STRIP_DAYS = 180;
const WEEKDAY_SHORT_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTH_SHORT_RU = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export type TaskSectionRow = { title: string; data: UserTask[]; sectionId: string };
export type CalendarStripDay = { key: string; dayNumber: number; weekdayLabel: string };

/** Texts of an empty list; «Сегодня» follows the design, the others keep the earlier copy. */
const EMPTY_COPY: Record<TaskMainView, { title: string; subtitle: string }> = {
  inbox: { title: "Входящие пусты", subtitle: "Здесь появятся все невыполненные задачи — с датой и без" },
  today: {
    title: "На сегодня задач нет",
    subtitle: "Здесь появятся задачи со сроком на сегодня.\nВсе незавершённые — во «Входящих».",
  },
  upcoming: { title: "Нет предстоящих задач", subtitle: "Запланируйте задачу на будущие дни" },
  completed: { title: "Нет выполненных за этот день", subtitle: "Выберите другую дату в полосе календаря выше" },
};

function parseMainView(params: { tab?: string | null; filter?: string | null; date?: string | null }): TaskMainView {
  const tab = params.tab;
  if (tab === "inbox" || tab === "today" || tab === "upcoming" || tab === "completed") return tab;
  if (params.filter === "today" || params.date === "today") return "today";
  return "inbox";
}

function stripDay(key: string): CalendarStripDay {
  const [year, month, day] = key.split("-").map((part) => parseInt(part, 10));
  return { key, dayNumber: day, weekdayLabel: WEEKDAY_SHORT_RU[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] };
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map((part) => parseInt(part, 10));
  return `${MONTH_SHORT_RU[month - 1]}. ${year}`;
}

function parseTaskId(raw: string | null): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function useClientTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramTab = searchParams.get("tab");
  const paramFilter = searchParams.get("filter");
  const paramDate = searchParams.get("date");
  const paramView = searchParams.get("view");

  const mainView = parseMainView({ tab: paramTab, filter: paramFilter, date: paramDate });
  const layoutMode: TaskLayoutMode = paramView === "calendar" ? "calendar" : "list";
  /** Desktop: the task open in the side card (?task=ID), so it survives a reload and can be shared. */
  const selectedTaskId = parseTaskId(searchParams.get("task"));

  const todayKey = useCurrentTaskDay();
  const tomorrowKey = useMemo(() => addCalendarDaysToDateKey(todayKey, 1), [todayKey]);
  const { counts, reload: reloadCounts } = useTaskCounts(todayKey);
  const { sorts, setSort } = useTaskSortPreference();
  const sortableView = mainView === "inbox" || mainView === "today" ? mainView : null;
  const taskSort: TaskSort | null = sortableView ? sorts[sortableView] : null;

  const [upcomingDate, setUpcomingDate] = useState<string | null>(null);
  const [upcomingVisibleDateKey, setUpcomingVisibleDateKey] = useState<string | null>(null);
  const [completedDateKey, setCompletedDateKey] = useState<string>(todayTaskDateKey);
  const [completedVisibleDateKey, setCompletedVisibleDateKey] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<MonthRef>(() => monthOfKey(todayTaskDateKey()));
  const [calendarDay, setCalendarDay] = useState<string>(todayTaskDateKey);
  const [composer, setComposer] = useState<{ open: boolean; dateKey: string | null }>({ open: false, dateKey: null });
  const [menuOpen, setMenuOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);

  useEffect(() => {
    if (!upcomingDate) setUpcomingDate(tomorrowKey);
  }, [upcomingDate, tomorrowKey]);

  const todoListQuery = useMemo((): UseTodoListQuery => {
    if (layoutMode === "calendar") return { view: "inbox", enabled: false };
    switch (mainView) {
      case "today":
        return { view: "list_today", today: todayKey, light: true, ...taskSortQuery(sorts.today) };
      case "upcoming": {
        const day = upcomingDate ?? tomorrowKey;
        return { view: "list_upcoming", today: todayKey, fromDate: day, toDate: day, light: true };
      }
      case "completed":
        return { view: "list_completed", completedOn: completedDateKey, light: true };
      default:
        return { view: "inbox", light: true, ...taskSortQuery(sorts.inbox) };
    }
  }, [layoutMode, mainView, todayKey, upcomingDate, tomorrowKey, completedDateKey, sorts]);

  const todo = useTodoList(todoListQuery);
  const { refresh: refreshList } = todo;
  /** «Повторить» of a failed list also brings back the tab badges. */
  const retry = useCallback(() => {
    reloadCounts();
    void refreshList();
  }, [reloadCounts, refreshList]);

  const upcomingStripDays = useMemo(
    () => Array.from({ length: STRIP_DAYS + 1 }, (_, index) => stripDay(addCalendarDaysToDateKey(todayKey, index + 1))),
    [todayKey],
  );
  const completedStripDays = useMemo(
    () => Array.from({ length: STRIP_DAYS + 1 }, (_, index) => stripDay(addCalendarDaysToDateKey(todayKey, index - STRIP_DAYS))),
    [todayKey],
  );
  const upcomingMonthLabel = monthLabel(upcomingVisibleDateKey ?? upcomingDate ?? tomorrowKey);
  const completedMonthLabel = monthLabel(completedVisibleDateKey ?? completedDateKey);

  const sections = useMemo((): TaskSectionRow[] => {
    if (todo.tasks.length === 0) return [];
    if (mainView === "upcoming") {
      const day = upcomingDate ?? tomorrowKey;
      return [{ title: formatDueDay(day, todayKey), data: todo.tasks, sectionId: `day-${day}` }];
    }
    // The server orders «Входящие» and «Сегодня» by the chosen sort.
    return [{ title: "", data: todo.tasks, sectionId: mainView }];
  }, [todo.tasks, mainView, upcomingDate, tomorrowKey, todayKey]);

  /** «9 незавершённых» / «Ср, 21 октября · 2 задачи» next to the sort button. */
  const listCaption = useMemo(() => {
    if (todo.loading && todo.tasks.length === 0) return null;
    if (mainView === "inbox") return pluralUnfinished(todo.total);
    if (mainView === "today") return `${formatDayHeading(todayKey)} · ${pluralTasks(todo.total)}`;
    return null;
  }, [mainView, todo.loading, todo.tasks.length, todo.total, todayKey]);

  const replaceParams = useCallback(
    (change: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      change(params);
      const query = params.toString();
      router.replace(query ? `/client/tasks?${query}` : "/client/tasks", { scroll: false });
    },
    [router, searchParams],
  );

  const setMainView = useCallback(
    (view: TaskMainView) => replaceParams((params) => {
      params.set("tab", view);
      params.delete("filter");
      params.delete("date");
    }),
    [replaceParams],
  );

  const setLayoutMode = useCallback(
    (mode: TaskLayoutMode) => replaceParams((params) => {
      if (mode === "calendar") params.set("view", "calendar");
      else params.delete("view");
    }),
    [replaceParams],
  );

  const selectTask = useCallback(
    (id: number | null) => replaceParams((params) => {
      if (id == null) params.delete("task");
      else params.set("task", String(id));
    }),
    [replaceParams],
  );

  const setTaskSort = useCallback(
    (sort: TaskSort) => {
      if (sortableView) setSort(sortableView, sort);
    },
    [sortableView, setSort],
  );

  /** «Новая задача»: the day of the calendar or of «Предстоящие» becomes its «Срок». */
  const openComposer = useCallback(
    (dateKey?: string | null) => {
      const contextDay = layoutMode === "calendar" ? calendarDay : mainView === "upcoming" ? upcomingDate : null;
      setComposer({ open: true, dateKey: dateKey ?? contextDay ?? null });
    },
    [layoutMode, calendarDay, mainView, upcomingDate],
  );
  const closeComposer = useCallback(() => setComposer((current) => ({ ...current, open: false })), []);

  const openTaskStats = useCallback(() => {
    setMenuOpen(false);
    router.push("/client/statistics");
  }, [router]);

  const openTeams = useCallback(() => {
    setMenuOpen(false);
    setTeamsOpen(true);
  }, []);

  return {
    tabs: TASK_VIEW_TABS,
    counts,
    mainView,
    setMainView,
    layoutMode,
    setLayoutMode,
    taskSort,
    setTaskSort,
    todayKey,
    tomorrowKey,
    listCaption,
    sections,
    emptyCopy: EMPTY_COPY[mainView],
    todo,
    retry,
    selectedTaskId,
    selectTask,
    upcomingDate,
    setUpcomingDate,
    setUpcomingVisibleDateKey,
    upcomingStripDays,
    upcomingMonthLabel,
    completedDateKey,
    setCompletedDateKey,
    setCompletedVisibleDateKey,
    completedStripDays,
    completedMonthLabel,
    calendarMonth,
    setCalendarMonth,
    calendarDay,
    setCalendarDay,
    composer,
    openComposer,
    closeComposer,
    menuOpen,
    setMenuOpen,
    teamsOpen,
    setTeamsOpen,
    openTaskStats,
    openTeams,
  };
}

export type UseClientTasksPageResult = ReturnType<typeof useClientTasksPage>;
