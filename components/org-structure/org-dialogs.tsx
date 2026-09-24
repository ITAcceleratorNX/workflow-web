"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { History, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import {
  ManagementAlertDialogCancel,
  ManagementAlertDialogContent,
  ManagementAlertDialogDescription,
  ManagementAlertDialogTitle,
} from "@/components/layout/management-alert-dialog";
import { ManagementModalShell } from "@/components/layout/management-modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatDateTime } from "./org-ui";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <ManagementAlertDialogContent>
        <AlertDialogHeader>
          <ManagementAlertDialogTitle>{title}</ManagementAlertDialogTitle>
          <ManagementAlertDialogDescription>{description}</ManagementAlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <ManagementAlertDialogCancel disabled={busy}>Отмена</ManagementAlertDialogCancel>
          <AlertDialogAction
            className={cn(destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              setBusy(true);
              void onConfirm().finally(() => setBusy(false));
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </ManagementAlertDialogContent>
    </AlertDialog>
  );
}

/** Модалка с одним полем «Название». */
export function NameDialog({
  open,
  title,
  label,
  initial,
  placeholder,
  submitLabel = "Сохранить",
  onSubmit,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  label: string;
  initial: string;
  placeholder?: string;
  submitLabel?: string;
  /** Возвращает текст ошибки или null при успехе. */
  onSubmit: (name: string) => Promise<string | null>;
  onClose: () => void;
  children?: ReactNode;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initial);
      setError(null);
    }
  }, [open, initial]);

  const submit = async () => {
    const name = value.trim();
    if (!name) return;
    setSaving(true);
    const err = await onSubmit(name);
    setSaving(false);
    if (err) setError(err);
  };

  return (
    <ManagementModalShell open={open} onClose={() => !saving && onClose()} title={title}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{label}</Label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            maxLength={255}
            disabled={saving}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
        </div>
        {children}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={() => void submit()} disabled={saving || !value.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
        </div>
      </div>
    </ManagementModalShell>
  );
}

type LogPage<T> = { ok: true; data: { items: T[]; total: number } } | { ok: false; error: string };

/** Журнал изменений с подгрузкой страниц. */
export function LogDialog<T extends { id: number; created_at: string; actor: { full_name: string } | null }>({
  open,
  title,
  fetchPage,
  describe,
  onClose,
}: {
  open: boolean;
  title: string;
  fetchPage: (page: number) => Promise<LogPage<T>>;
  describe: (item: T) => string;
  onClose: () => void;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (p: number) => {
      setLoading(true);
      const res = await fetchPage(p);
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setTotal(res.data.total);
      setPage(p);
      setItems((prev) => (p === 1 ? res.data.items : [...prev, ...res.data.items]));
    },
    [fetchPage],
  );

  useEffect(() => {
    if (open) void loadPage(1);
  }, [open, loadPage]);

  return (
    <ManagementModalShell open={open} onClose={onClose} title={title} maxWidthClass="max-w-2xl">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!loading && items.length === 0 && !error ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <History className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Изменений пока нет</p>
        </div>
      ) : (
        <ol className="space-y-0">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 border-b border-border py-3 last:border-b-0">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#F35713]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{describe(item)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDateTime(item.created_at)} · {item.actor?.full_name ?? "Система"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-[#F35713]" />
        </div>
      ) : items.length < total ? (
        <Button variant="outline" className="mt-3 w-full" onClick={() => void loadPage(page + 1)}>
          Показать ещё
        </Button>
      ) : null}
    </ManagementModalShell>
  );
}
