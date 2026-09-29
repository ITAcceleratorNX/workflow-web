"use client";

import type { ReactNode } from "react";
import { Building2, Eye, Landmark, ShieldCheck, User, Users } from "lucide-react";

import { isReadOnlyTask } from "@/lib/group-task-completion";
import type { GroupTaskFields, TaskExecutorRef, TaskTeamRef } from "@/lib/user-tasks-api";

export type TaskBadgeSource = Pick<
  GroupTaskFields,
  "assignment_type" | "targetCompany" | "targetDepartment" | "targetUsers" | "responsible" | "task_permissions"
> & {
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

function groupBadge(task: TaskBadgeSource): { icon: ReactNode; label: string } | null {
  const icon = "h-3 w-3 shrink-0";
  if (task.assignment_type === "company") {
    return { icon: <Building2 className={icon} />, label: task.targetCompany?.name ?? "Компания" };
  }
  if (task.assignment_type === "department") {
    return { icon: <Landmark className={icon} />, label: task.targetDepartment?.name ?? "Отдел" };
  }
  if (task.assignment_type === "users") {
    const count = task.targetUsers?.length ?? 0;
    return { icon: <Users className={icon} />, label: count ? `Сотрудники: ${count}` : "Сотрудники" };
  }
  return null;
}

function Pill({ primary, filled, children }: { primary: string; filled?: boolean; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold max-w-full"
      style={{ borderColor: primary, color: primary, backgroundColor: filled ? `${primary}18` : "transparent" }}
    >
      {children}
    </span>
  );
}

/** Бейджи получателя для списков, календаря и карточки: команда, исполнитель или группа, «Только просмотр». */
export function TaskAssignmentBadges({ task, primary, currentUserId, compact }: TaskAssignmentBadgesProps) {
  const wrap = `flex flex-wrap items-center gap-1.5 ${compact ? "mt-1" : "mt-1.5"}`;
  const readOnly = isReadOnlyTask(task) ? (
    <Pill primary={primary}>
      <Eye className="h-3 w-3 shrink-0" />
      <span className="truncate">Только просмотр</span>
    </Pill>
  ) : null;

  const group = groupBadge(task);
  if (group) {
    const responsible = task.responsible?.full_name
      ? currentUserId != null && task.responsible.id === currentUserId
        ? "Вы"
        : task.responsible.full_name
      : null;
    return (
      <div className={wrap}>
        {readOnly}
        <Pill primary={primary}>
          {group.icon}
          <span className="truncate max-w-[148px]">{group.label}</span>
        </Pill>
        {responsible ? (
          <Pill primary={primary} filled>
            <ShieldCheck className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[148px]">{responsible}</span>
          </Pill>
        ) : null}
      </div>
    );
  }

  const teamName = task.team_id && task.team?.name ? task.team.name : null;
  const executorName = !teamName && task.executor_id && task.executor?.full_name ? task.executor.full_name : null;
  const legacyAssignee =
    !teamName && !executorName && task.assignees?.[0]?.full_name ? task.assignees[0].full_name : null;
  const personName = executorName ?? legacyAssignee;
  if (!teamName && !personName && !readOnly) return null;
  const isMe = currentUserId != null && task.executor_id === currentUserId;

  return (
    <div className={wrap}>
      {readOnly}
      {teamName ? (
        <Pill primary={primary}>
          <Users className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[148px]">{teamName}</span>
        </Pill>
      ) : null}
      {personName ? (
        <Pill primary={primary} filled={isMe}>
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[148px]">{isMe ? "Вы" : personName}</span>
        </Pill>
      ) : null}
    </div>
  );
}
