"use client";

import { memo } from "react";
import { Building2, Check, Eye, Flag, User, Users } from "lucide-react";
import { isReadOnlyTask } from "@/lib/group-task-completion";
import { dueSummary, taskDue } from "@/lib/task-due";
import { taskRecipientSummary, type RecipientIcon } from "@/lib/task-recipient-display";
import type { UserTask } from "@/lib/user-tasks-api";
import { cn } from "@/lib/utils";

type TaskListItemProps = {
  task: UserTask;
  todayKey: string;
  currentUserId: number | null;
  onToggle: (task: UserTask) => void;
  onOpen: (task: UserTask) => void;
  /** Desktop: the task open in the side card. */
  selected?: boolean;
  /**
   * `desktop` — the denser row of the desktop list, the flag inside the meta line;
   * `compact` — a row of the desktop calendar day, on the card color.
   */
  density?: "mobile" | "desktop" | "compact";
  /** The list is of one day: the meta line shows only the time. */
  timeOnly?: boolean;
};

const RECIPIENT_ICONS: Record<RecipientIcon, typeof User> = { person: User, group: Users, company: Building2 };

/**
 * A task in a list (Figma «Задача · …»): the check circle, the title and one meta line — the due
 * date (red when overdue), the recipient and the high-priority flag. A completed task stays
 * crossed out with a green circle until the list drops it.
 */
export const TaskListItem = memo(function TaskListItem({
  task,
  todayKey,
  currentUserId,
  onToggle,
  onOpen,
  selected = false,
  density = "mobile",
  timeOnly = false,
}: TaskListItemProps) {
  const desktop = density !== "mobile";
  const compact = density === "compact";
  const summary = dueSummary(task, todayKey);
  const time = timeOnly ? taskDue(task)?.time ?? null : null;
  const due = timeOnly ? (time ? { ...summary, text: time } : null) : summary;
  const recipient = taskRecipientSummary(task, currentUserId);
  const RecipientGlyph = recipient ? RECIPIENT_ICONS[recipient.icon] : null;
  const readOnly = isReadOnlyTask(task);
  const highPriority = task.priority === "high";
  const title = task.title.trim() || "Без названия";

  const separator = <span aria-hidden className="text-ui-fg/30">·</span>;
  const flag = highPriority ? <Flag aria-label="Высокий приоритет" className="size-4 shrink-0 fill-ui-danger text-ui-danger" /> : null;

  return (
    <div
      className={cn(
        "flex items-center border transition-colors",
        compact ? "gap-3 rounded-xl px-3 py-[11px]" : desktop ? "gap-3.5 rounded-xl py-2.5 pl-4 pr-4" : "gap-3 rounded-2xl py-3 pl-3 pr-3.5",
        selected ? "border-ui-accent/70 bg-ui-selected" : cn("border-transparent", compact ? "bg-ui-fg/[0.03]" : "bg-ui-surface"),
        desktop && !selected && "hover:bg-ui-fg/[0.06]",
        task.completed && "opacity-70",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(task)}
        aria-label={task.completed ? `Вернуть в работу: ${title}` : `Отметить выполненной: ${title}`}
        aria-pressed={task.completed}
        className={cn(
          "-m-[5px] flex shrink-0 items-center justify-center rounded-full p-[5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
          readOnly && "opacity-40",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex items-center justify-center rounded-full",
            desktop ? "size-5" : "size-[22px]",
            task.completed ? "bg-ui-done" : "border-2 border-ui-fg/55",
          )}
        >
          {task.completed ? <Check className="size-3.5 text-ui-fg" strokeWidth={3} /> : null}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onOpen(task)}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex min-w-0 flex-1 flex-col rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
          compact ? "gap-[3px]" : "gap-[5px]",
        )}
      >
        <span
          className={cn(
            "line-clamp-2 font-medium text-ui-fg/95",
            compact ? "text-sm leading-[17px]" : desktop ? "text-[15px] leading-[18px]" : "text-base leading-[19px]",
            task.completed && "text-ui-fg/45 line-through",
          )}
        >
          {title}
        </span>
        <span className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-0.5", compact ? "text-xs leading-[14px]" : "text-[13px] leading-4")}>
          {due ? (
            <span
              className={cn(
                due.tone === "overdue" && !task.completed
                  ? "font-semibold text-ui-danger"
                  : due.tone === "none"
                    ? "text-ui-fg/35"
                    : "text-ui-fg/50",
              )}
            >
              {due.tone === "overdue" && !task.completed ? <span className="sr-only">Просрочено: </span> : null}
              {due.text}
            </span>
          ) : null}
          {recipient && RecipientGlyph ? (
            <>
              {due ? separator : null}
              <span className="inline-flex min-w-0 items-center gap-1 text-ui-fg/60">
                <RecipientGlyph aria-hidden className="size-[13px] shrink-0 opacity-80" />
                <span className="truncate">{recipient.label}</span>
              </span>
            </>
          ) : null}
          {readOnly ? (
            <>
              {separator}
              <span className="inline-flex items-center gap-1 text-ui-fg/60">
                <Eye aria-hidden className="size-[13px]" />
                Только просмотр
              </span>
            </>
          ) : null}
          {desktop && flag ? (
            <>
              {separator}
              {flag}
            </>
          ) : null}
        </span>
      </button>

      {!desktop ? flag : null}
    </div>
  );
});
