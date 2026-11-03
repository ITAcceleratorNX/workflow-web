"use client";

import { Check, ListChecks, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RequestBulkDelete } from "@/hooks/use-request-bulk-delete";
import { DeleteRequestModal } from "./admin-request-decision-modals";
import { cn } from "@/lib/utils";

interface RequestBulkDeleteBarProps {
  bulk: RequestBulkDelete;
  /** id заявок, видимых сейчас в списке, — для «Выбрать все». */
  visibleIds: number[];
  variant?: "mobile" | "desktop";
}

/** Панель над списком заявок Руководителя: «Выбрать» → выбор карточек → «Удалить» (с необязательной причиной). */
export function RequestBulkDeleteBar({ bulk, visibleIds, variant = "mobile" }: RequestBulkDeleteBarProps) {
  const isDesktop = variant === "desktop";
  const muted = isDesktop ? "text-[#D1D1D6] hover:text-ui-fg hover:bg-white/5" : "text-muted-foreground";

  if (!bulk.active) {
    if (visibleIds.length === 0) return null;
    return (
      <div className={cn("flex justify-end", isDesktop && "mb-3")}>
        <Button
          variant="ghost"
          size="sm"
          onClick={bulk.start}
          className={cn("gap-2", muted, isDesktop && "h-9 px-3 text-[15px] font-semibold [&_svg]:size-[18px]")}
        >
          <ListChecks className="h-4 w-4" />
          Выбрать
        </Button>
      </div>
    );
  }

  const count = bulk.selectedIds.size;
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => bulk.selectedIds.has(id));

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-10 flex flex-wrap items-center gap-2 border",
          isDesktop
            ? "mb-5 min-h-[55px] rounded-2xl border-[#484848] bg-[#1A1A1A] px-[18px] py-2 text-ui-fg"
            : "rounded-2xl border-border bg-card px-3 py-2 text-foreground",
        )}
      >
        <span className={cn("mr-auto font-semibold", isDesktop ? "text-[15px]" : "text-sm font-medium")}>Выбрано: {count}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => bulk.toggleAll(visibleIds)}
          className={cn(muted, isDesktop && "h-9 px-3 text-[15px] font-normal text-[#C7C7CC]")}
        >
          {allSelected ? "Снять выбор" : "Выбрать все"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={count === 0 || bulk.deleting}
          onClick={() => void bulk.deleteSelected()}
          className={cn(
            "gap-2",
            isDesktop && "h-9 rounded-[10px] bg-[#7A2222] px-4 text-[15px] font-semibold text-ui-fg hover:bg-[#8C2828]",
          )}
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
          className={cn(muted, isDesktop ? "h-9 w-9 [&_svg]:size-5" : "h-8 w-8")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <DeleteRequestModal
        isOpen={bulk.pendingIds !== null}
        count={bulk.pendingIds?.length ?? 0}
        loading={bulk.deleting}
        error={bulk.error}
        onClose={bulk.closeDialog}
        onDelete={bulk.confirmDelete}
      />
    </>
  );
}

interface RequestSelectWrapperProps {
  bulk?: RequestBulkDelete;
  requestId: number;
  variant?: "mobile" | "desktop";
  children: React.ReactNode;
}

/** В режиме выбора добавляет галочку слева от карточки и подсвечивает выбранные. */
export function RequestSelectWrapper({ bulk, requestId, variant = "mobile", children }: RequestSelectWrapperProps) {
  if (!bulk?.active) return <>{children}</>;
  const selected = bulk.selectedIds.has(requestId);
  const isDesktop = variant === "desktop";
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={selected ? "Снять выбор заявки" : "Выбрать заявку"}
        onClick={() => bulk.toggle(requestId)}
        className={cn(
          "flex shrink-0 items-center justify-center border-2 transition-colors",
          isDesktop
            ? cn(
                "h-[22px] w-[22px] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D2B]/60",
                selected ? "border-[#E85D2B] bg-[#E85D2B] text-ui-fg" : "border-[#8E8E93] bg-transparent text-ui-fg",
              )
            : cn(
                "h-6 w-6 rounded-md",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-transparent",
              ),
        )}
      >
        {selected ? <Check className={isDesktop ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={3} /> : null}
      </button>
      <div
        className={cn(
          "min-w-0 flex-1",
          // Десктоп: строка в рамке 2px, её отступы сжаты до 3px — высота и шаг строк как без выбора.
          isDesktop
            ? cn("rounded-xl border-2 transition-colors [&>*]:py-[3px]", selected ? "border-[#E85D2B]" : "border-transparent")
            : cn("rounded-2xl transition-shadow", selected && "ring-2 ring-primary"),
        )}
      >
        {children}
      </div>
    </div>
  );
}
