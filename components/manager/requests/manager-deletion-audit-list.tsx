"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestHistoryList } from "@/components/requests/request-history-list";
import { getStatusLabel, getTypeLabel } from "@/constants/requests";
import { RQ_DESKTOP_BUTTON, RQ_DESKTOP_CARD } from "@/constants/requests-desktop-ui";
import { formatDateTime } from "@/lib/dateTimeUtils";
import { getRequestDeletionAudit, type RequestDeletionAuditEntry } from "@/lib/request-audit-api";
import { listLoadError } from "@/lib/request-list-loading";
import { cn } from "@/lib/utils";

interface ManagerDeletionAuditListProps {
  variant?: "mobile" | "desktop";
}

/** Поле снимка заявки: на десктопе (макет «Журнал удалений») значение сразу за подписью, на телефоне — колонкой. */
function AuditField({ label, dark, children }: { label: string; dark: boolean; children: ReactNode }) {
  return (
    <div className={dark ? "flex flex-wrap gap-x-3 leading-[27px]" : "contents"}>
      <dt className={dark ? "text-[#A1A1A6]" : "text-muted-foreground"}>{label}</dt>
      <dd className={dark ? "text-white" : "text-foreground"}>{children}</dd>
    </div>
  );
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

  const muted = dark ? "text-[#A1A1A6]" : "text-muted-foreground";
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
    <div className={dark ? "space-y-3.5" : "space-y-3"}>
      {entries.map((entry) => {
        const snapshot = entry.snapshot ?? { id: entry.request_group_id };
        const expanded = expandedId === entry.id;
        const Chevron = expanded ? ChevronUp : ChevronDown;
        return (
          <div
            key={entry.id}
            className={dark ? cn(RQ_DESKTOP_CARD, "px-5 py-4") : "rounded-2xl border border-border bg-card p-4"}
          >
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : entry.id)}
              className="flex w-full items-start justify-between gap-3 text-left"
              aria-expanded={expanded}
            >
              <div className={cn("min-w-0", dark ? "space-y-1.5" : "space-y-1")}>
                <p className={cn("font-semibold", strong, dark && "text-xl")}>
                  Заявка #{entry.request_group_id}
                  {entry.request_id ? ` · подзаявка #${entry.request_id}` : ""}
                </p>
                <p className={cn(dark ? "text-sm" : "text-xs", muted)}>
                  Удалил: {entry.deleted_by_name ?? `#${entry.deleted_by}`} · {formatDateTime(entry.deleted_at)}
                </p>
                <p className={cn(dark ? "text-base" : "text-sm", entry.reason ? strong : dark ? "text-[#C7C7CC]" : muted)}>
                  {entry.reason ? `Причина: ${entry.reason}` : "Причина не указана"}
                </p>
              </div>
              <Chevron className={cn("h-5 w-5 shrink-0", dark ? "text-[#D1D1D6]" : muted)} />
            </button>

            {expanded && (
              <div className={cn("mt-4 space-y-4 border-t pt-4", dark ? "border-[#39393C] text-base" : "border-border text-sm")}>
                <dl className={dark ? undefined : "grid grid-cols-[auto_1fr] gap-x-3 gap-y-1"}>
                  {snapshot.status && (
                    <AuditField label="Статус" dark={dark}>{getStatusLabel(snapshot.status)}</AuditField>
                  )}
                  {snapshot.request_type && (
                    <AuditField label="Тип" dark={dark}>{getTypeLabel(snapshot.request_type)}</AuditField>
                  )}
                  {snapshot.created_date && (
                    <AuditField label="Создана" dark={dark}>{formatDateTime(snapshot.created_date)}</AuditField>
                  )}
                  {snapshot.client && (
                    <AuditField label="Клиент" dark={dark}>{snapshot.client.full_name}</AuditField>
                  )}
                  {snapshot.office && (
                    <AuditField label="Офис" dark={dark}>{snapshot.office.name}</AuditField>
                  )}
                  {snapshot.location && (
                    <AuditField label="Локация" dark={dark}>
                      {snapshot.location}
                      {snapshot.location_detail ? `, ${snapshot.location_detail}` : ""}
                    </AuditField>
                  )}
                  {snapshot.rejection_reason && (
                    <AuditField label="Причина отклонения" dark={dark}>{snapshot.rejection_reason}</AuditField>
                  )}
                </dl>

                {(snapshot.requests?.length ?? 0) > 0 && (
                  <div className="space-y-1">
                    <p className={cn("uppercase", dark ? "text-[13px] font-semibold tracking-[0.04em]" : "text-xs font-medium", muted)}>
                      Подзаявки
                    </p>
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
                  <p className={cn("uppercase", dark ? "text-[13px] font-semibold tracking-[0.04em]" : "text-xs font-medium", muted)}>
                    История до удаления
                  </p>
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
          {dark ? (
            <button type="button" className={RQ_DESKTOP_BUTTON} disabled={loading} onClick={() => void load(page + 1)}>
              {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Показать ещё
            </button>
          ) : (
            <Button variant="outline" size="sm" disabled={loading} onClick={() => void load(page + 1)}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Показать ещё"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
