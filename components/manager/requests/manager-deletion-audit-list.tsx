"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestHistoryList } from "@/components/requests/request-history-list";
import { getStatusLabel, getTypeLabel } from "@/constants/requests";
import { formatDateTime } from "@/lib/dateTimeUtils";
import { getRequestDeletionAudit, type RequestDeletionAuditEntry } from "@/lib/request-audit-api";
import { listLoadError } from "@/lib/request-list-loading";
import { cn } from "@/lib/utils";

interface ManagerDeletionAuditListProps {
  variant?: "mobile" | "desktop";
}

/** Контрольный журнал удалений: только чтение, новые записи первыми. */
export function ManagerDeletionAuditList({ variant = "mobile" }: ManagerDeletionAuditListProps) {
  const dark = variant === "desktop";
  const [entries, setEntries] = useState<RequestDeletionAuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const version = useRef(0);

  const load = useCallback(async (nextPage: number) => {
    const current = ++version.current;
    setLoading(true);
    setError(null);
    try {
      const result = await getRequestDeletionAudit(nextPage);
      if (current !== version.current) return;
      setEntries((prev) => (nextPage === 1 ? result.data : [...prev, ...result.data]));
      setPage(nextPage);
      setTotalPages(result.totalPages);
    } catch (failure) {
      if (current === version.current) setError(listLoadError(failure));
    } finally {
      if (current === version.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
    return () => { version.current += 1; };
  }, [load]);

  const muted = dark ? "text-gray-400" : "text-muted-foreground";
  const strong = dark ? "text-white" : "text-foreground";

  if (error && entries.length === 0) {
    return (
      <div className="space-y-3 py-6 text-center">
        <p className="text-sm text-[#F35713]">Не удалось загрузить журнал удалений. {error}</p>
        <Button variant="outline" size="sm" onClick={() => void load(1)}>Повторить</Button>
      </div>
    );
  }

  if (!loading && entries.length === 0) {
    return <p className={cn("py-6 text-center text-sm", muted)}>Удалённых заявок нет</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const snapshot = entry.snapshot ?? { id: entry.request_group_id };
        const expanded = expandedId === entry.id;
        return (
          <div
            key={entry.id}
            className={cn("rounded-2xl border p-4", dark ? "border-white/10 bg-[#262626]" : "border-border bg-card")}
          >
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : entry.id)}
              className="flex w-full items-start justify-between gap-3 text-left"
              aria-expanded={expanded}
            >
              <div className="min-w-0 space-y-1">
                <p className={cn("font-semibold", strong)}>
                  Заявка #{entry.request_group_id}
                  {entry.request_id ? ` · подзаявка #${entry.request_id}` : ""}
                </p>
                <p className={cn("text-xs", muted)}>
                  Удалил: {entry.deleted_by_name ?? `#${entry.deleted_by}`} · {formatDateTime(entry.deleted_at)}
                </p>
                <p className={cn("text-sm", entry.reason ? strong : muted)}>
                  {entry.reason ? `Причина: ${entry.reason}` : "Причина не указана"}
                </p>
              </div>
              {expanded ? <ChevronUp className={cn("h-5 w-5 shrink-0", muted)} /> : <ChevronDown className={cn("h-5 w-5 shrink-0", muted)} />}
            </button>

            {expanded && (
              <div className={cn("mt-4 space-y-4 border-t pt-4 text-sm", dark ? "border-white/10" : "border-border")}>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  {snapshot.status && (
                    <>
                      <dt className={muted}>Статус</dt>
                      <dd className={strong}>{getStatusLabel(snapshot.status)}</dd>
                    </>
                  )}
                  {snapshot.request_type && (
                    <>
                      <dt className={muted}>Тип</dt>
                      <dd className={strong}>{getTypeLabel(snapshot.request_type)}</dd>
                    </>
                  )}
                  {snapshot.created_date && (
                    <>
                      <dt className={muted}>Создана</dt>
                      <dd className={strong}>{formatDateTime(snapshot.created_date)}</dd>
                    </>
                  )}
                  {snapshot.client && (
                    <>
                      <dt className={muted}>Клиент</dt>
                      <dd className={strong}>{snapshot.client.full_name}</dd>
                    </>
                  )}
                  {snapshot.office && (
                    <>
                      <dt className={muted}>Офис</dt>
                      <dd className={strong}>{snapshot.office.name}</dd>
                    </>
                  )}
                  {snapshot.location && (
                    <>
                      <dt className={muted}>Локация</dt>
                      <dd className={strong}>
                        {snapshot.location}
                        {snapshot.location_detail ? `, ${snapshot.location_detail}` : ""}
                      </dd>
                    </>
                  )}
                  {snapshot.rejection_reason && (
                    <>
                      <dt className={muted}>Причина отклонения</dt>
                      <dd className={strong}>{snapshot.rejection_reason}</dd>
                    </>
                  )}
                </dl>

                {(snapshot.requests?.length ?? 0) > 0 && (
                  <div className="space-y-1">
                    <p className={cn("text-xs font-medium uppercase", muted)}>Подзаявки</p>
                    <ul className="space-y-1">
                      {snapshot.requests?.map((sub) => (
                        <li key={sub.id} className={strong}>
                          #{sub.id} {sub.title} <span className={muted}>· {getStatusLabel(sub.status)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <p className={cn("text-xs font-medium uppercase", muted)}>История до удаления</p>
                  <RequestHistoryList entries={entry.history ?? []} dark={dark} />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {error && entries.length > 0 && <p className="text-sm text-[#F35713]">{error}</p>}

      {(loading || page < totalPages) && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" disabled={loading} onClick={() => void load(page + 1)}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Показать ещё"}
          </Button>
        </div>
      )}
    </div>
  );
}
