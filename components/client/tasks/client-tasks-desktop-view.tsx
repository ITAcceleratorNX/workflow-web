"use client";

import { useCallback } from "react";
import { CalendarDays, List, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipTabs } from "@/components/ui/chip-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TaskCalendarDesktop } from "@/components/tasks/task-calendar";
import { TaskComposer } from "@/components/tasks/task-composer";
import { TaskDayStrip } from "@/components/tasks/task-day-strip";
import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskListContent } from "@/components/tasks/task-list-content";
import { TaskMoreMenu } from "@/components/tasks/task-more-menu";
import { TaskSortPicker } from "@/components/tasks/task-sort-picker";
import { TeamsInboxPanel } from "@/components/teams/teams-inbox-panel";
import type { TaskLayoutMode, UseClientTasksPageResult } from "@/hooks/use-client-tasks-page";
import type { UserTask } from "@/lib/user-tasks-api";
import { useAuthStore } from "@/stores/useAuthStore";

const LIST_PANEL_ID = "tasks-desktop-list";
const LAYOUT_OPTIONS = [
  { value: "list" as const, label: "Список", icon: <List className="size-[18px]" aria-hidden /> },
  { value: "calendar" as const, label: "Календарь", icon: <CalendarDays className="size-[18px]" aria-hidden /> },
];

/**
 * Desktop tasks screen (Figma «Задачи — Входящие + карточка», «Сегодня», «режим календаря»): the list
 * with the open task in a card on the right (?task=ID), or the month with the day panel.
 */
export function ClientTasksDesktopView(page: UseClientTasksPageResult) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const { todo, mainView, layoutMode, selectedTaskId, selectTask } = page;
  const { toggleComplete, loadMore: loadMoreTasks } = todo;
  const openTask = useCallback((task: UserTask) => selectTask(task.id), [selectTask]);
  const toggle = useCallback((task: UserTask) => void toggleComplete(task), [toggleComplete]);
  const loadMore = useCallback(() => void loadMoreTasks(), [loadMoreTasks]);
  const closeTask = useCallback(() => selectTask(null), [selectTask]);

  const detail = selectedTaskId != null ? (
    <TaskDetail key={selectedTaskId} taskId={selectedTaskId} todayKey={page.todayKey} variant="panel" onClose={closeTask} onGone={closeTask} />
  ) : null;

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[18px] px-8 py-[26px] text-ui-fg">
      <header className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-bold leading-[33px]">Задачи</h1>
          <p className="mt-1.5 text-sm text-ui-fg/55">Личные задачи и задачи команды</p>
        </div>
        <Button variant="accent" className="h-10 gap-2 rounded-xl pl-[18px] pr-5 text-[15px]" onClick={() => page.openComposer()}>
          <Plus className="!size-[18px]" aria-hidden />
          Новая задача
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3 py-4">
        {layoutMode === "list" ? (
          <ChipTabs
            variant="track"
            ariaLabel="Списки задач"
            value={mainView}
            onChange={page.setMainView}
            controls={LIST_PANEL_ID}
            tabs={page.tabs.map((tab) => ({
              ...tab,
              count: tab.value === "completed" ? null : page.counts?.[tab.value] ?? null,
            }))}
          />
        ) : null}
        <div className="flex-1" />
        {layoutMode === "list" && page.taskSort ? (
          <TaskSortPicker variant="menu" value={page.taskSort} onChange={page.setTaskSort} />
        ) : null}
        <TaskMoreMenu
          variant="popover"
          open={page.menuOpen}
          onOpenChange={page.setMenuOpen}
          onOpenStats={page.openTaskStats}
          onOpenTeams={page.openTeams}
        />
        <SegmentedControl<TaskLayoutMode>
          ariaLabel="Вид задач"
          value={layoutMode}
          onChange={page.setLayoutMode}
          options={LAYOUT_OPTIONS}
          className="rounded-[10px]"
          optionClassName="min-h-[30px] gap-1.5 rounded-lg pl-2.5 pr-3 text-[13px]"
        />
      </div>

      {layoutMode === "calendar" ? (
        selectedTaskId != null ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
            <TaskCalendarDesktop
              month={page.calendarMonth}
              onMonthChange={page.setCalendarMonth}
              day={page.calendarDay}
              onDayChange={page.setCalendarDay}
              todayKey={page.todayKey}
              onOpenTask={openTask}
              onAddForDay={page.openComposer}
              selectedTaskId={selectedTaskId}
            />
            <aside aria-label="Карточка задачи" className="xl:sticky xl:top-4 xl:h-[calc(100vh-120px)]">
              {detail}
            </aside>
          </div>
        ) : (
          <TaskCalendarDesktop
            month={page.calendarMonth}
            onMonthChange={page.setCalendarMonth}
            day={page.calendarDay}
            onDayChange={page.setCalendarDay}
            todayKey={page.todayKey}
            onOpenTask={openTask}
            onAddForDay={page.openComposer}
          />
        )
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-4">
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
              selectedTaskId={selectedTaskId}
              density="desktop"
            />
          </div>
          <aside aria-label="Карточка задачи" className="lg:sticky lg:top-4 lg:h-[calc(100vh-120px)] lg:min-h-[480px]">
            {detail ?? (
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-[18px] border border-ui-fg/[0.08]">
                <EmptyState icon={<ListChecks />} title="Выберите задачу" description="Подробности откроются здесь" />
              </div>
            )}
          </aside>
        </div>
      )}

      <TaskComposer
        variant="window"
        open={page.composer.open}
        onClose={page.closeComposer}
        dateKey={page.composer.dateKey}
        todayKey={page.todayKey}
        onCreate={todo.addTask}
        onCreated={(task) => selectTask(task.id)}
      />
      {page.teamsOpen ? <TeamsInboxPanel onClose={() => page.setTeamsOpen(false)} /> : null}
    </div>
  );
}
