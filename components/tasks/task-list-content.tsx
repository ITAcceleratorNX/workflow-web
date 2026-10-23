"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Inbox, Loader2, Sun, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskListItem } from "@/components/tasks/task-list-item";
import type { TaskSectionRow } from "@/hooks/use-client-tasks-page";
import type { TaskMainView } from "@/lib/task-views";
import type { UserTask } from "@/lib/user-tasks-api";
import { cn } from "@/lib/utils";

const EMPTY_ICONS: Record<TaskMainView, typeof Inbox> = {
  inbox: Inbox,
  today: Sun,
  upcoming: CalendarClock,
  completed: CheckCircle2,
};

type TaskListContentProps = {
  id: string;
  mainView: TaskMainView;
  sections: TaskSectionRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  emptyCopy: { title: string; subtitle: string };
  /** «Сегодня» is empty: offers «Открыть входящие». */
  onOpenInbox: () => void;
  todayKey: string;
  currentUserId: number | null;
  onToggle: (task: UserTask) => void;
  onOpen: (task: UserTask) => void;
  selectedTaskId?: number | null;
  density: "mobile" | "desktop";
};

/**
 * The list of a tab with its states: skeleton rows while loading, the error with «Повторить»
 * (keeping the last loaded rows), the empty text of the tab, and more rows on scroll.
 */
export function TaskListContent({
  id,
  mainView,
  sections,
  loading,
  error,
  onRetry,
  hasMore,
  loadingMore,
  onLoadMore,
  emptyCopy,
  onOpenInbox,
  todayKey,
  currentUserId,
  onToggle,
  onOpen,
  selectedTaskId,
  density,
}: TaskListContentProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const empty = sections.length === 0;

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
    }, { rootMargin: "240px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  const gap = density === "desktop" ? "gap-1.5" : "gap-2";

  if (loading && empty) {
    return (
      <div id={id} role="status" aria-label="Загружаем задачи" className={cn("flex flex-col", gap)}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn("animate-pulse bg-ui-surface", density === "desktop" ? "h-[59px] rounded-xl" : "h-16 rounded-2xl")}
          />
        ))}
      </div>
    );
  }

  if (error && empty) {
    return (
      <div id={id} role="alert">
        <EmptyState
          className="pt-16"
          icon={<AlertCircle />}
          title="Не удалось загрузить задачи"
          description={error}
          action={
            <Button variant="accent-outline" className="h-10 rounded-xl px-[18px] text-[15px]" onClick={onRetry}>
              Повторить
            </Button>
          }
        />
      </div>
    );
  }

  if (empty) {
    const Icon = EMPTY_ICONS[mainView];
    return (
      <div id={id}>
        <EmptyState
          className={density === "desktop" ? "pt-20" : "pt-[90px]"}
          icon={<Icon />}
          title={emptyCopy.title}
          description={emptyCopy.subtitle}
          action={
            mainView === "today" ? (
              <Button variant="accent-outline" className="h-10 rounded-xl px-[18px] text-[15px]" onClick={onOpenInbox}>
                Открыть входящие
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div id={id} className="flex flex-col gap-3">
      {error ? (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border border-ui-danger/60 bg-ui-danger-soft px-3.5 py-2.5 text-[13px] text-ui-fg/80">
          <AlertCircle className="size-5 shrink-0 text-ui-danger" aria-hidden />
          <span className="flex-1">
            {error}
            <span className="block text-ui-fg/60">Показаны данные последней успешной загрузки.</span>
          </span>
          <button type="button" onClick={onRetry} className="min-h-9 rounded-[10px] bg-ui-fg/[0.12] px-3 text-sm font-semibold text-ui-fg">
            Повторить
          </button>
        </div>
      ) : null}
      {sections.map((section) => (
        <section key={section.sectionId} aria-label={section.title || undefined} className="flex flex-col gap-2">
          {section.title ? (
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ui-fg/50">{section.title}</p>
          ) : null}
          <ul className={cn("flex flex-col", gap)}>
            {section.data.map((task) => (
              <li key={task.id}>
                <TaskListItem
                  task={task}
                  todayKey={todayKey}
                  currentUserId={currentUserId}
                  onToggle={onToggle}
                  onOpen={onOpen}
                  selected={selectedTaskId === task.id}
                  density={density}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {hasMore ? <div ref={sentinel} aria-hidden className="h-px" /> : null}
      {loadingMore ? (
        <div role="status" className="flex justify-center py-3">
          <Loader2 className="size-5 animate-spin text-ui-accent" aria-label="Загружаем ещё" />
        </div>
      ) : null}
    </div>
  );
}
