"use client";

import { formatDateTime } from "@/lib/dateTimeUtils";
import type { RequestHistoryEntry } from "@/lib/request-audit-api";
import { getRoleLabel } from "@/constants/roles";
import { cn } from "@/lib/utils";

interface RequestHistoryListProps {
  entries: RequestHistoryEntry[];
  /** Тёмная панель десктопа или тема приложения. */
  dark?: boolean;
}

/** История статусов и действий по заявке — от старых к новым. */
export function RequestHistoryList({ entries, dark = false }: RequestHistoryListProps) {
  if (entries.length === 0) {
    return <p className={cn("text-sm", dark ? "text-gray-400" : "text-muted-foreground")}>История пуста</p>;
  }
  return (
    <ol className="space-y-2">
      {entries.map((entry) => (
        <li key={entry.id} className={cn("border-l-2 pl-3", dark ? "border-white/15" : "border-border")}>
          <p className={cn("text-sm", dark ? "text-white" : "text-foreground")}>{entry.action_description}</p>
          <p className={cn("text-xs", dark ? "text-gray-400" : "text-muted-foreground")}>
            {formatDateTime(entry.created_at)}
            {entry.user ? ` · ${entry.user.full_name}${entry.user.role ? ` (${getRoleLabel(entry.user.role)})` : ""}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
