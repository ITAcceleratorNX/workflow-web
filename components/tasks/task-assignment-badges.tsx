"use client";

import { User, Users } from "lucide-react";
import type { TaskExecutorRef, TaskTeamRef } from "@/lib/user-tasks-api";

export type TaskBadgeSource = {
  team_id?: number | null;
  executor_id?: number | null;
  team?: TaskTeamRef | null;
  executor?: TaskExecutorRef | null;
  assignees?: { id: number; full_name: string }[];
};

type TaskAssignmentBadgesProps = {
  task: TaskBadgeSource;
  primary: string;
  currentUserId?: number | null;
  compact?: boolean;
};

export function TaskAssignmentBadges({
  task,
  primary,
  currentUserId,
  compact,
}: TaskAssignmentBadgesProps) {
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
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "mt-1" : "mt-1.5"}`}>
      {teamName ? (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold max-w-full truncate"
          style={{ borderColor: primary, color: primary }}
        >
          <Users className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[148px]">{teamName}</span>
        </span>
      ) : null}
      {personName ? (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold max-w-full truncate"
          style={{
            borderColor: primary,
            color: primary,
            backgroundColor:
              currentUserId != null && task.executor_id === currentUserId
                ? `${primary}18`
                : "transparent",
          }}
        >
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[148px]">
            {currentUserId != null && task.executor_id === currentUserId ? "Вы" : personName}
          </span>
        </span>
      ) : null}
    </div>
  );
}
