"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Inbox,
  LayoutList,
  Loader2,
  MoreHorizontal,
  Plus,
  Users,
  X,
  Check,
} from "lucide-react";
import { CalendarTab } from "@/components/tasks/calendar-tab";
import { TaskAddSheet } from "@/components/tasks/task-add-sheet";
import { UserTaskRow } from "@/components/tasks/user-task-row";
import { TeamsInboxPanel } from "@/components/teams/teams-inbox-panel";
import { ScreenHeader } from "@/components/ui/screen-header";
import type { UseClientTasksPageResult } from "@/hooks/use-client-tasks-page";
import { useAuthStore } from "@/stores/useAuthStore";

type ClientTasksMobileViewProps = UseClientTasksPageResult;

/** Mobile client tasks — parity с workflow-mobile app/client/tasks.tsx. */
export function ClientTasksMobileView(props: ClientTasksMobileViewProps) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const [teamsPanelOpen, setTeamsPanelOpen] = useState(false);

  const {
    viewTabs,
    mainView,
    setMainView,
    viewMode,
    applyLayout,
    todayKey,
    tomorrowKey,
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
  } = props;

  const headerRight = (
    <button
      type="button"
      onClick={() => setDisplayMenuOpen(true)}
      className="w-11 h-11 flex items-center justify-center"
      aria-label="Вид, календарь и команды"
    >
      <MoreHorizontal className="h-[26px] w-[26px] text-[#E25B21]" />
    </button>
  );

  return (
    <>
      <div
        className="min-h-screen bg-background flex flex-col"
        
      >
        <ScreenHeader title="Задачи" rightSlot={headerRight} />

        {viewMode === "list" && (
          <div className="px-4 pt-2.5 pb-1.5">
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {viewTabs.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMainView(opt.value)}
                  className={`shrink-0 rounded-full border px-3 py-2 text-[13px] font-semibold transition-colors ${
                    opt.value === mainView
                      ? "border-[#E25B21]/40 bg-[#E25B21]/15 text-[#E25B21]"
                      : "border-[#3A3A3C] text-[#8E8E93]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {mainView === "upcoming" && (
              <div className="mt-2.5">
                <p className="text-base font-bold text-white capitalize mb-2">{upcomingMonthLabel}</p>
                <div
                  className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const idx = Math.max(
                      0,
                      Math.min(
                        upcomingStripDays.length - 1,
                        Math.round(el.scrollLeft / 50),
                      ),
                    );
                    const visibleKey = upcomingStripDays[idx]?.key ?? null;
                    if (visibleKey) setUpcomingVisibleDateKey(visibleKey);
                  }}
                >
                  {upcomingStripDays.map((d) => {
                    const isSelected = d.key === upcomingDate;
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setUpcomingDate(d.key)}
                        className="w-[42px] shrink-0 flex flex-col items-center gap-1.5"
                      >
                        <span
                          className={`text-[11px] font-semibold ${
                            isSelected ? "text-[#E25B21]" : "text-[#8E8E93]"
                          }`}
                        >
                          {d.weekdayLabel}
                        </span>
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                            isSelected ? "bg-[#E25B21] text-white" : "text-white"
                          }`}
                        >
                          {d.dayNumber}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {mainView === "completed" && (
              <div className="mt-2.5">
                <p className="text-base font-bold text-white capitalize mb-2">{completedMonthLabel}</p>
                <div
                  className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const idx = Math.max(
                      0,
                      Math.min(
                        completedStripDays.length - 1,
                        Math.round(el.scrollLeft / 50),
                      ),
                    );
                    const visibleKey = completedStripDays[idx]?.key ?? null;
                    if (visibleKey) setCompletedVisibleDateKey(visibleKey);
                  }}
                >
                  {completedStripDays.map((d) => {
                    const isSelected = d.key === completedDateKey;
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setCompletedDateKey(d.key)}
                        className="w-[42px] shrink-0 flex flex-col items-center gap-1.5"
                      >
                        <span
                          className={`text-[11px] font-semibold ${
                            isSelected ? "text-[#E25B21]" : "text-[#8E8E93]"
                          }`}
                        >
                          {d.weekdayLabel}
                        </span>
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                            isSelected ? "bg-[#E25B21] text-white" : "text-white"
                          }`}
                        >
                          {d.dayNumber}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === "calendar" ? (
          <div className="flex-1 min-h-0 flex flex-col pt-2">
            <CalendarTab />
          </div>
        ) : loadingTasks ? (
          <div className="flex-1 flex items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-[#E25B21]" />
          </div>
        ) : (
          <div className="flex-1 relative">
            <div className="px-4 pt-3 pb-24 overflow-y-auto max-h-[calc(100vh-220px)]">
              {sections.length === 0 ? (
                <div className="flex flex-col items-center py-12 px-6 text-center">
                  {mainView === "completed" ? (
                    <CheckCircle2 className="h-12 w-12 text-[#8E8E93] mb-4" />
                  ) : (
                    <Inbox className="h-12 w-12 text-[#8E8E93] mb-4" />
                  )}
                  <p className="text-lg font-semibold text-white">{emptyCopy.title}</p>
                  <p className="text-sm text-[#8E8E93] mt-1">{emptyCopy.subtitle}</p>
                </div>
              ) : (
                sections.map((section) => (
                  <div key={section.sectionId}>
                    {section.title ? (
                      <p className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] mt-2 mb-1.5">
                        {section.title}
                      </p>
                    ) : null}
                    {section.data.map((item) => (
                      <UserTaskRow
                        key={item.id}
                        item={item}
                        todayKey={todayKey}
                        sectionId={section.sectionId}
                        onToggle={() => void toggleComplete(item)}
                        onPressRow={() => router.push(`/client/tasks/${item.id}`)}
                        currentUserId={currentUserId}
                      />
                    ))}
                  </div>
                ))
              )}
              {loadingMore ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-[#E25B21]" />
                </div>
              ) : null}
              {hasMore && !loadingMore ? (
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  className="w-full py-3 text-sm font-medium text-[#E25B21]"
                >
                  Загрузить ещё
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setAddSheetOpen(true)}
              aria-label="Добавить задачу"
              className="fixed right-4 bottom-[calc(52px+max(env(safe-area-inset-bottom,0px),10px)+8px)] w-14 h-14 rounded-full bg-[#E25B21] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform z-10"
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>
        )}
      </div>

      {displayMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setDisplayMenuOpen(false)}
            aria-label="Закрыть"
          />
          <div className="relative bg-[#1C1C1E] rounded-t-2xl px-4 pt-2 pb-8 border-t border-[#3A3A3C]">
            <div className="flex items-center justify-between border-b border-[#3A3A3C] pb-3.5 mb-1">
              <button
                type="button"
                onClick={() => setDisplayMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center"
              >
                <X className="h-[22px] w-[22px] text-white" />
              </button>
              <p className="text-[17px] font-bold text-white flex-1 text-center">Вид и команды</p>
              <button
                type="button"
                onClick={() => setDisplayMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-[#E25B21] flex items-center justify-center"
              >
                <Check className="h-[22px] w-[22px] text-white" />
              </button>
            </div>

            <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8E8E93] mt-3 mb-2.5">
              Раскладка
            </p>
            <div className="flex gap-4 rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] p-3.5 justify-around">
              <button type="button" onClick={() => applyLayout("list")} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`w-[52px] h-[52px] rounded-[10px] border flex items-center justify-center ${
                    viewMode === "list" ? "border-[#E25B21]" : "border-[#3A3A3C]"
                  }`}
                >
                  <LayoutList
                    className={`h-[26px] w-[26px] ${viewMode === "list" ? "text-[#E25B21]" : "text-[#8E8E93]"}`}
                  />
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-full ${
                    viewMode === "list" ? "bg-[#E25B21] text-white" : "text-[#8E8E93]"
                  }`}
                >
                  Список
                </span>
              </button>
              <button
                type="button"
                onClick={() => applyLayout("calendar")}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className={`w-[52px] h-[52px] rounded-[10px] border flex items-center justify-center ${
                    viewMode === "calendar" ? "border-[#E25B21]" : "border-[#3A3A3C]"
                  }`}
                >
                  <Calendar
                    className={`h-[26px] w-[26px] ${viewMode === "calendar" ? "text-[#E25B21]" : "text-[#8E8E93]"}`}
                  />
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-full ${
                    viewMode === "calendar" ? "bg-[#E25B21] text-white" : "text-[#8E8E93]"
                  }`}
                >
                  Календарь
                </span>
              </button>
            </div>

            <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8E8E93] mt-5 mb-2.5">
              Статистика
            </p>
            <button
              type="button"
              onClick={openTaskStats}
              className="w-full flex items-center gap-3 rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] px-3.5 py-3.5 active:opacity-85"
            >
              <BarChart3 className="h-6 w-6 text-[#E25B21]" />
              <span className="flex-1 text-left text-base font-semibold text-white">Статистика</span>
              <ChevronRightIcon />
            </button>

            <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8E8E93] mt-5 mb-2.5">
              Команды
            </p>
            <button
              type="button"
              onClick={() => {
                setDisplayMenuOpen(false);
                setTeamsPanelOpen(true);
              }}
              className="w-full flex items-center gap-3 rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] px-3.5 py-3.5 active:opacity-85"
            >
              <Users className="h-6 w-6 text-[#E25B21]" />
              <span className="flex-1 text-left text-base font-semibold text-white">Команды</span>
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}

      <TaskAddSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        mainView={mainView}
        todayKey={todayKey}
        tomorrowKey={tomorrowKey}
        defaultDateKey={mainView === "upcoming" ? upcomingDate : null}
        addTask={addTask}
      />

      {teamsPanelOpen ? <TeamsInboxPanel onClose={() => setTeamsPanelOpen(false)} /> : null}
    </>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#8E8E93]">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
