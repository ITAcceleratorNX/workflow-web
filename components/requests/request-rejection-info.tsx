"use client";

import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";
import { RequestHistoryList } from "@/components/requests/request-history-list";
import { formatDateTime } from "@/lib/dateTimeUtils";
import { getRequestHistory, type RequestHistoryEntry } from "@/lib/request-audit-api";
import { listLoadError } from "@/lib/request-list-loading";
import type { RequestGroup } from "@/lib/types/request";
import { cn } from "@/lib/utils";

interface RequestRejectionInfoProps {
  request: RequestGroup;
  userRole: string;
  /** Тёмная панель десктопа или тема приложения. */
  dark?: boolean;
}

/** Роли, которым видно, кем и когда отклонена заявка, и её история статусов. */
const STAFF_ROLES = new Set(["admin-worker", "manager"]);

/**
 * Карточка отклонённой заявки: причина видна всем, кому видна заявка (клиенту — тоже).
 * Администратор и Руководитель дополнительно видят, кем и когда она отклонена, и историю статусов.
 */
export function RequestRejectionInfo({ request, userRole, dark = false }: RequestRejectionInfoProps) {
  const isStaff = STAFF_ROLES.has(userRole);
  const [history, setHistory] = useState<RequestHistoryEntry[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const rejected = request.status === "rejected";

  useEffect(() => {
    if (!rejected || !isStaff) return;
    let cancelled = false;
    setHistory(null);
    setHistoryError(null);
    getRequestHistory(request.id)
      .then((entries) => { if (!cancelled) setHistory(entries); })
      .catch((failure) => { if (!cancelled) setHistoryError(listLoadError(failure)); });
    return () => { cancelled = true; };
  }, [rejected, isStaff, request.id]);

  if (!rejected) return null;

  const rejectionLog = history?.filter((entry) => entry.action_type === "rejected").at(-1);
  const rejectedByName = request.rejectedBy?.full_name ?? rejectionLog?.user?.full_name;
  const rejectedAt = request.rejected_at ?? rejectionLog?.created_at;
  const muted = dark ? "text-gray-400" : "text-muted-foreground";
  const strong = dark ? "text-white" : "text-foreground";

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-xl border p-4 space-y-2",
          dark ? "border-red-500/30 bg-red-500/10" : "border-destructive/30 bg-destructive/10",
        )}
      >
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <p className={cn("font-medium", strong)}>Заявка отклонена</p>
        </div>
        <div>
          <p className={cn("text-sm", muted)}>Причина отклонения</p>
          <p className={cn("whitespace-pre-wrap break-words", strong)}>
            {request.rejection_reason?.trim() || "Причина не указана"}
          </p>
        </div>
        {isStaff && (rejectedByName || rejectedAt) && (
          <p className={cn("text-sm", muted)}>
            Отклонил{rejectedByName ? `: ${rejectedByName}` : ""}
            {rejectedAt ? ` · ${formatDateTime(rejectedAt)}` : ""}
          </p>
        )}
      </div>

      {isStaff && (
        <div className={cn("rounded-xl p-4 space-y-2", dark ? "bg-[#1C1C1E]" : "bg-muted/40")}>
          <p className={cn("text-sm", muted)}>История статусов</p>
          {historyError ? (
            <p className="text-sm text-[#F35713]">Не удалось загрузить историю. {historyError}</p>
          ) : history === null ? (
            <p className={cn("text-sm", muted)}>Загрузка...</p>
          ) : (
            <RequestHistoryList entries={history} dark={dark} />
          )}
        </div>
      )}
    </div>
  );
}
