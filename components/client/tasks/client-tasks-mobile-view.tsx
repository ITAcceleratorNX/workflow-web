"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, List, Plus } from "lucide-react";
import { ChipTabs } from "@/components/ui/chip-tabs";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TaskCalendarMobile } from "@/components/tasks/task-calendar";
import { TaskComposer } from "@/components/tasks/task-composer";
import { TaskDayStrip } from "@/components/tasks/task-day-strip";
import { TaskListContent } from "@/components/tasks/task-list-content";
import { TaskMoreMenu } from "@/components/tasks/task-more-menu";
import { TaskSortPicker } from "@/components/tasks/task-sort-picker";
import { TeamsInboxPanel } from "@/components/teams/teams-inbox-panel";
import type { TaskLayoutMode, UseClientTasksPageResult } from "@/hooks/use-client-tasks-page";
import type { UserTask } from "@/lib/user-tasks-api";
import { useAuthStore } from "@/stores/useAuthStore";

const LIST_PANEL_ID = "tasks-list-panel";

export const TASK_LAYOUT_OPTIONS = [
  { value: "list" as const, icon: <List className="size-5" aria-hidden />, ariaLabel: "Список" },
  { value: "calendar" as const, icon: <CalendarDays className="size-5" aria-hidden />, ariaLabel: "Календарь" },
];

/** Phone tasks screen (Figma «Задачи — Входящие / Сегодня / режим календаря»). */
export function ClientTasksMobileView(page: UseClientTasksPageResult) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const { todo, mainView, layoutMode } = page;
  const { toggleComplete, loadMore: loadMoreTasks } = todo;
  const openTask = useCallback((task: UserTask) => router.push(`/client/tasks/${task.id}`), [router]);
  const toggle = useCallback((task: UserTask) => void toggleComplete(task), [toggleComplete]);
  const loadMore = useCallback(() => void loadMoreTasks(), [loadMoreTasks]);

  return (
    <div className="flex min-h-[100dvh] flex-col gap-3.5 bg-ui-canvas px-4 pb-28 pt-[max(16px,env(safe-area-inset-top))] text-ui-fg">
      <div className="flex min-h-11 items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-1 inline-flex min-h-11 items-center gap-1.5 text-lg text-ui-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
        >
          <ChevronLeft className="size-6" aria-hidden />
          Назад
        </button>
        <div className="flex items-center gap-2">
          <SegmentedControl<TaskLayoutMode>
            ariaLabel="Вид задач"
            value={layoutMode}
            onChange={page.setLayoutMode}
            options={TASK_LAYOUT_OPTIONS}
            optionClassName="min-h-[30px] w-[38px] px-0"
          />
          <TaskMoreMenu
            variant="sheet"
            open={page.menuOpen}
            onOpenChange={page.setMenuOpen}
            onOpenStats={page.openTaskStats}
            onOpenTeams={page.openTeams}
          />
        </div>
      </div>

      {layoutMode === "calendar" ? (
        <TaskCalendarMobile
          month={page.calendarMonth}
          onMonthChange={page.setCalendarMonth}
          day={page.calendarDay}
          onDayChange={page.setCalendarDay}
          todayKey={page.todayKey}
          onOpenTask={openTask}
          onAddForDay={page.openComposer}
        />
      ) : (
        <>
          <h1 className="text-[26px] font-bold leading-[31px]">Задачи</h1>
          <ChipTabs
            ariaLabel="Списки задач"
            value={mainView}
            onChange={page.setMainView}
            controls={LIST_PANEL_ID}
            tabs={page.tabs.map((tab) => ({
              ...tab,
              count: tab.value === "completed" ? null : page.counts?.[tab.value] ?? null,
            }))}
          />
          {page.taskSort ? (
            <div className="flex min-h-[30px] items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[13px] text-ui-fg/50" aria-live="polite">
                {page.listCaption}
              </p>
              <TaskSortPicker variant="sheet" value={page.taskSort} onChange={page.setTaskSort} />
            </div>
          ) : null}
          {mainView === "upcoming" && page.upcomingDate ? (
            <TaskDayStrip
              ariaLabel="День предстоящих задач"
              days={page.upcomingStripDays}
              selected={page.upcomingDate}
              onSelect={page.setUpcomingDate}
              onVisibleChange={page.setUpcomingVisibleDateKey}
              monthLabel={page.upcomingMonthLabel}
            />
          ) : null}
          {mainView === "completed" ? (
            <TaskDayStrip
              ariaLabel="День выполненных задач"
              days={page.completedStripDays}
              selected={page.completedDateKey}
              onSelect={page.setCompletedDateKey}
              onVisibleChange={page.setCompletedVisibleDateKey}
              monthLabel={page.completedMonthLabel}
            />
          ) : null}
          <TaskListContent
            id={LIST_PANEL_ID}
            mainView={mainView}
            sections={page.sections}
            loading={todo.loading}
            error={todo.error}
            onRetry={page.retry}
            hasMore={todo.hasMore}
            loadingMore={todo.loadingMore}
            onLoadMore={loadMore}
            emptyCopy={page.emptyCopy}
            onOpenInbox={() => page.setMainView("inbox")}
            todayKey={page.todayKey}
            currentUserId={currentUserId}
            onToggle={toggle}
            onOpen={openTask}
            density="mobile"
          />
        </>
      )}

      <button
        type="button"
        onClick={() => page.openComposer()}
        aria-label="Новая задача"
        className="fixed bottom-[calc(52px+max(env(safe-area-inset-bottom,0px),10px)+8px)] right-4 z-10 flex size-14 items-center justify-center rounded-full bg-ui-accent text-ui-fg shadow-[0_6px_16px_rgba(0,0,0,0.4)] transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
      >
        <Plus className="size-[30px]" aria-hidden />
      </button>

      <TaskComposer
        variant="screen"
        open={page.composer.open}
        onClose={page.closeComposer}
        dateKey={page.composer.dateKey}
        todayKey={page.todayKey}
        onCreate={todo.addTask}
      />
      {page.teamsOpen ? <TeamsInboxPanel onClose={() => page.setTeamsOpen(false)} /> : null}
    </div>
  );
}
