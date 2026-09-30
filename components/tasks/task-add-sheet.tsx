"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronRight, Loader2, User, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TaskMainView } from "@/lib/task-views";
import { toUtcIsoFromAppDateTime } from "@/lib/dateTimeUtils";
import type { UseTodoListResult } from "@/hooks/use-todo-list";
import { TaskRecipientPicker } from "@/components/tasks/task-recipient-picker";
import { confirmMassAssignment } from "@/lib/group-task-completion";
import {
  massAssignmentConfirmText,
  recipientSelectionLabel,
  type RecipientSelection,
} from "@/lib/task-recipients-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { confirmAction } from "@/stores/confirm-dialog-store";
import { cn } from "@/lib/utils";

type TaskAddSheetVariant = "sheet" | "dialog";

type TaskAddSheetProps = {
  open: boolean;
  onClose: () => void;
  mainView: TaskMainView;
  todayKey: string;
  tomorrowKey: string;
  defaultDateKey?: string | null;
  addTask: UseTodoListResult["addTask"];
  /** Bottom sheet on mobile; centered dialog on desktop. */
  variant?: TaskAddSheetVariant;
};

/** Упрощённое создание задачи — parity с workflow-mobile TaskAddSheet (базовый сценарий). */
export function TaskAddSheet({
  open,
  onClose,
  mainView,
  todayKey,
  tomorrowKey,
  defaultDateKey,
  addTask,
  variant = "sheet",
}: TaskAddSheetProps) {
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const wasOpen = useRef(false);
  const initialDate = useRef("");
  const closePending = useRef(false);
  const recipientTriggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const dateId = useId();
  const recipientId = useId();
  const [recipient, setRecipient] = useState<RecipientSelection | null>(null);
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const isGuest = useAuthStore((s) => s.isGuest);

  useEffect(() => {
    if (open && !wasOpen.current) {
      const date = mainView === "inbox" ? "" : mainView === "today" ? todayKey : mainView === "upcoming" ? defaultDateKey ?? tomorrowKey : "";
      initialDate.current = date;
      setTitle("");
      setRecipient(null);
      setRecipientPickerOpen(false);
      setScheduledDate(date);
      setSaveError(null);
    }
    wasOpen.current = open;
  }, [open, mainView, todayKey, tomorrowKey, defaultDateKey]);

  const requestClose = async () => {
    if (saving || closePending.current) return;
    const hasDraft = title.length > 0 || recipient != null || scheduledDate !== initialDate.current;
    if (hasDraft) {
      closePending.current = true;
      try {
        const discard = await confirmAction({
          title: "Закрыть без сохранения?",
          message: "Данные новой задачи будут потеряны.",
          confirmLabel: "Не сохранять",
          cancelLabel: "Продолжить редактирование",
          destructive: true,
        });
        if (!discard) return;
      } finally {
        closePending.current = false;
      }
    }
    onClose();
  };

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Вся компания или отдел — сначала подтвердить массовое назначение.
      if (!(await confirmMassAssignment(massAssignmentConfirmText(recipient)))) return;
      const inbox = mainView === "inbox" && !scheduledDate;
      const scheduledAt = scheduledDate
        ? toUtcIsoFromAppDateTime(scheduledDate, "09:00")
        : null;
      const created = await addTask(trimmed, scheduledAt, false, null, recipient ? { recipient } : undefined, "medium", undefined, {
        inbox,
      });
      if (created) onClose();
      else setSaveError("Не удалось сохранить задачу. Проверьте соединение и попробуйте ещё раз.");
    } catch {
      setSaveError("Не удалось сохранить задачу. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  };

  const form = (
    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void handleSave(); }}>
      <div>
        <label htmlFor={titleId} className="text-sm text-[#8E8E93] mb-1.5 block">Название</label>
        <input
          id={titleId}
          disabled={saving}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Что нужно сделать?"
          className="w-full rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] px-4 py-3 text-white placeholder:text-[#8E8E93] outline-none focus:border-[#E25B21]"
        />
      </div>

      {mainView !== "completed" && (
        <div>
          <label htmlFor={dateId} className="text-sm text-[#8E8E93] mb-1.5 block">Дата (необязательно)</label>
          <input
            id={dateId}
            disabled={saving}
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] px-4 py-3 text-white outline-none focus:border-[#E25B21] [color-scheme:dark]"
          />
        </div>
      )}

      {!isGuest ? (
        <div>
          <span id={recipientId} className="text-sm text-[#8E8E93] mb-1.5 block">Исполнитель (необязательно)</span>
          <div className="flex items-center gap-1 rounded-xl border border-[#3A3A3C] bg-[#2C2C2E]">
            <button
              ref={recipientTriggerRef}
              type="button"
              disabled={saving}
              aria-labelledby={recipientId}
              aria-describedby={`${recipientId}-value`}
              onClick={() => setRecipientPickerOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E25B21]"
            >
              <User className="h-5 w-5 shrink-0 text-[#8E8E93]" />
              <span id={`${recipientId}-value`} className={`flex-1 truncate ${recipient ? "text-white" : "text-[#8E8E93]"}`}>
                {recipient ? recipientSelectionLabel(recipient) : "Себе — выбрать сотрудника, отдел или компанию"}
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-[#8E8E93]" />
            </button>
            {recipient ? (
              <button
                type="button"
                disabled={saving}
                aria-label="Убрать исполнителя"
                onClick={() => setRecipient(null)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#8E8E93] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E25B21]"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {saveError ? <p role="alert" className="text-sm text-red-300">{saveError}</p> : null}
      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="w-full rounded-xl bg-[hsl(var(--action-background))] py-3.5 font-semibold text-[hsl(var(--action-foreground))] disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E25B21]"
      >
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Сохранить
      </button>
    </form>
  );

  const picker = (
    <TaskRecipientPicker
      visible={recipientPickerOpen}
      returnFocusRef={recipientTriggerRef}
      onClose={() => setRecipientPickerOpen(false)}
      currentUserId={currentUserId}
      value={recipient}
      onConfirm={(selection) => {
        setRecipient(selection);
        setRecipientPickerOpen(false);
      }}
      variant={variant}
    />
  );

  const isDialog = variant === "dialog";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && void requestClose()}>
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={isDialog}
        overlayClassName={isDialog ? undefined : "bg-black/45"}
        onEscapeKeyDown={(event) => { if (saving) event.preventDefault(); }}
        className={cn(
          "border-[#3A3A3C] bg-[#1C1C1E] text-white max-h-[90dvh] overflow-y-auto [&>button]:text-[#8E8E93] [&>button]:hover:text-white",
          isDialog
            ? "max-w-md sm:rounded-2xl"
            : "inset-x-0 bottom-0 top-auto left-0 w-full max-w-none translate-x-0 translate-y-0 gap-4 rounded-t-2xl border-0 border-t px-4 pt-3 pb-[max(32px,env(safe-area-inset-bottom))] sm:rounded-b-none !animate-none",
        )}
        style={isDialog ? undefined : { transform: "none" }}
      >
        <DialogHeader className={isDialog ? undefined : "flex-row items-center justify-between space-y-0 text-left"}>
          <DialogTitle className="text-lg font-bold text-white">Новая задача</DialogTitle>
          {!isDialog ? (
            <button type="button" disabled={saving} onClick={() => void requestClose()} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2C2C2E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E25B21]" aria-label="Закрыть">
              <X className="h-5 w-5 text-white" />
            </button>
          ) : null}
        </DialogHeader>
        {form}
        {picker}
      </DialogContent>
    </Dialog>
  );
}
