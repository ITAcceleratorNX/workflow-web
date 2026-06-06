"use client";

import { Check, ChevronRight, Clock, Flag, Users, User } from "lucide-react";
import { formatDateForApi, formatTimeOnly } from "@/lib/dateTimeUtils";
import { formatSectionDateLabel } from "@/lib/task-views";
import type { UserTask } from "@/lib/user-tasks-api";

export interface UserTaskRowProps {
  item: UserTask;
  todayKey: string;
  sectionId?: string;
  onToggle: () => void;
  onPressRow: () => void;
  currentUserId?: number | null;
}

function buildScheduleLine(
  dateStr: string | null,
  timeStr: string | null,
  todayKey: string,
  sectionId?: string,
): { text: string; showClock: boolean } | null {
  if (!dateStr && !timeStr) return null;
  if (!dateStr && timeStr) return { text: timeStr, showClock: true };

  const dStr = dateStr!;

  if (sectionId === "today" || sectionId === "done-today") {
    if (timeStr) return { text: timeStr, showClock: true };
    return { text: formatSectionDateLabel(dStr, todayKey), showClock: false };
  }

  if (sectionId?.startsWith("day-")) {
    const sectionDay = sectionId.slice("day-".length);
    if (dStr === sectionDay) {
      if (timeStr) return { text: timeStr, showClock: true };
      return { text: formatSectionDateLabel(dStr, todayKey), showClock: false };
    }
  }

  const dateLabel = formatSectionDateLabel(dStr, todayKey);
  if (timeStr) return { text: `${dateLabel} · ${timeStr}`, showClock: false };
  return { text: dateLabel, showClock: false };
}

function TaskAssignmentBadges({
  task,
  currentUserId,
  compact,
}: {
  task: UserTask;
  currentUserId?: number | null;
  compact?: boolean;
}) {
  const teamName = task.team_id && task.team?.name ? task.team.name : null;
  const executorName =
    !teamName && task.executor_id && task.executor?.full_name ? task.executor.full_name : null;
  const legacyAssignee =
    !teamName && !executorName && task.assignees?.[0]?.full_name
      ? task.assignees[0].full_name
      : null;
  const personName = executorName ?? legacyAssignee;

  if (!teamName && !personName) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 items-center ${compact ? "mt-1" : "mt-1.5"}`}>
      {teamName ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-[#E25B21] text-[11px] font-semibold text-[#E25B21] max-w-full">
          <Users className="h-3 w-3 shrink-0" />
          <span className="truncate">{teamName}</span>
        </span>
      ) : null}
      {personName ? (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-[#E25B21] text-[11px] font-semibold text-[#E25B21] max-w-full ${
            currentUserId != null && task.executor_id === currentUserId ? "bg-[#E25B21]/10" : ""
          }`}
        >
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {currentUserId != null && task.executor_id === currentUserId ? "Вы" : personName}
          </span>
        </span>
      ) : null}
    </div>
  );
}

/** Строка задачи — parity с workflow-mobile UserTaskRow. */
export function UserTaskRow({
  item,
  todayKey,
  sectionId,
  onToggle,
  onPressRow,
  currentUserId,
}: UserTaskRowProps) {
  const titleRaw = item.title ?? "";
  const firstLine = (titleRaw.split("\n")[0] ?? "").trim() || "Без названия";
  const dateStr = item.scheduled_at ? formatDateForApi(new Date(item.scheduled_at)) : null;
  const timeStr = item.scheduled_at ? formatTimeOnly(item.scheduled_at) : null;
  const schedule = buildScheduleLine(dateStr, timeStr, todayKey, sectionId);
  const priorityColor =
    item.priority === "high" ? "#EF4444" : item.priority === "low" ? "#22C55E" : "#F59E0B";
  const showPriorityFlag = item.priority === "high" || item.priority === "low";

  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[#3A3A3C] bg-[#2C2C2E] px-3.5 py-3 mb-2">
      <button
        type="button"
        onClick={onToggle}
        aria-label={item.completed ? "Отметить невыполненной" : "Отметить выполненной"}
        className={`w-[22px] h-[22px] rounded-full border-2 shrink-0 flex items-center justify-center ${
          item.completed ? "bg-[#E25B21] border-[#E25B21]" : "border-[#3A3A3C]"
        }`}
      >
        {item.completed ? <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /> : null}
      </button>

      <button type="button" onClick={onPressRow} className="flex-1 flex items-center gap-2 min-w-0 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p
              className={`flex-1 text-base font-medium leading-[22px] line-clamp-2 ${
                item.completed ? "text-[#8E8E93] line-through" : "text-white"
              }`}
            >
              {firstLine}
            </p>
            {showPriorityFlag ? (
              <Flag className="h-4 w-4 shrink-0 mt-0.5" style={{ color: priorityColor }} />
            ) : null}
          </div>
          {schedule ? (
            <div className="flex items-center gap-1 mt-1">
              {schedule.showClock ? (
                <Clock className="h-3.5 w-3.5 text-[#8E8E93] shrink-0" />
              ) : null}
              <span className="text-[13px] text-[#8E8E93] truncate">{schedule.text}</span>
            </div>
          ) : null}
          <TaskAssignmentBadges task={item} currentUserId={currentUserId} compact />
        </div>
        <ChevronRight className="h-[22px] w-[22px] text-[#8E8E93] shrink-0" />
      </button>
    </div>
  );
}
