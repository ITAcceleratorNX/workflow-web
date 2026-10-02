"use client";

import { Check, ListChecks, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RequestBulkDelete } from "@/hooks/use-request-bulk-delete";
import { cn } from "@/lib/utils";

interface RequestBulkDeleteBarProps {
  bulk: RequestBulkDelete;
  /** id заявок, видимых сейчас в списке, — для «Выбрать все». */
  visibleIds: number[];
  variant?: "mobile" | "desktop";
}

/** Панель над списком заявок: «Выбрать» → выбор карточек → «Удалить». */
export function RequestBulkDeleteBar({ bulk, visibleIds, variant = "mobile" }: RequestBulkDeleteBarProps) {
  const isDesktop = variant === "desktop";
  const muted = isDesktop ? "text-white/70 hover:text-white hover:bg-white/10" : "text-muted-foreground";

  if (!bulk.active) {
    if (visibleIds.length === 0) return null;
    return (
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={bulk.start} className={cn("gap-2", muted)}>
          <ListChecks className="h-4 w-4" />
          Выбрать
        </Button>
      </div>
    );
  }

  const count = bulk.selectedIds.size;
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => bulk.selectedIds.has(id));

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2",
        isDesktop ? "border-white/10 bg-[#1A1A1A] text-white" : "border-border bg-card text-foreground",
      )}
    >
      <span className="mr-auto text-sm font-medium">Выбрано: {count}</span>
      <Button variant="ghost" size="sm" onClick={() => bulk.toggleAll(visibleIds)} className={muted}>
        {allSelected ? "Снять выбор" : "Выбрать все"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={count === 0 || bulk.deleting}
        onClick={() => void bulk.deleteSelected()}
        className="gap-2"
      >
        {bulk.deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Удалить
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Отменить выбор"
        onClick={bulk.cancel}
        disabled={bulk.deleting}
        className={cn("h-8 w-8", muted)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface RequestSelectWrapperProps {
  bulk?: RequestBulkDelete;
  requestId: number;
  children: React.ReactNode;
}

/** В режиме выбора добавляет галочку слева от карточки и подсвечивает выбранные. */
export function RequestSelectWrapper({ bulk, requestId, children }: RequestSelectWrapperProps) {
  if (!bulk?.active) return <>{children}</>;
  const selected = bulk.selectedIds.has(requestId);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={selected ? "Снять выбор заявки" : "Выбрать заявку"}
        onClick={() => bulk.toggle(requestId)}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-transparent",
        )}
      >
        {selected ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
      </button>
      <div className={cn("min-w-0 flex-1 rounded-2xl transition-shadow", selected && "ring-2 ring-primary")}>
        {children}
      </div>
    </div>
  );
}
