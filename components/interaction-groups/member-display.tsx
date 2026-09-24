"use client";

import { Building2, FolderOpen, UserRound } from "lucide-react";
import type { InteractionMember, InteractionMemberType } from "@/lib/task-interaction-groups-api";

export const MEMBER_TYPE_LABEL: Record<InteractionMemberType, string> = {
  company: "Вся компания",
  department: "Отдел",
  user: "Сотрудник",
};

export function MemberIcon({ type, className }: { type: InteractionMemberType; className?: string }) {
  if (type === "company") return <Building2 className={className} />;
  if (type === "department") return <FolderOpen className={className} />;
  return <UserRound className={className} />;
}

/** «Отдел · TMK · Tengiz Towers» — контекст участника. */
export function memberSubtitle(m: Pick<InteractionMember, "type" | "company" | "office" | "position">): string {
  const parts: string[] = [MEMBER_TYPE_LABEL[m.type]];
  if (m.type !== "company" && m.company) parts.push(m.company.name);
  if (m.type === "user" && m.position) parts.push(m.position);
  if (m.office) parts.push(m.office.name);
  return parts.join(" · ");
}
