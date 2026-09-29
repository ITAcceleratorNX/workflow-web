"use client";

import { useEffect, useState } from "react";
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
  const [recipient, setRecipient] = useState<RecipientSelection | null>(null);
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const isGuest = useAuthStore((s) => s.isGuest);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setRecipient(null);
    setRecipientPickerOpen(false);
    if (mainView === "inbox") {
      setScheduledDate("");
    } else if (mainView === "today") {
      setScheduledDate(todayKey);
    } else if (mainView === "upcoming") {
      setScheduledDate(defaultDateKey ?? tomorrowKey);
    } else {
      setScheduledDate("");
    }
  }, [open, mainView, todayKey, tomorrowKey, defaultDateKey]);

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    // Вся компания или отдел — задача уйдёт всем её сотрудникам: сначала спросить.
    if (!(await confirmMassAssignment(massAssignmentConfirmText(recipient)))) return;
    setSaving(true);
    try {
      const inbox = mainView === "inbox" && !scheduledDate;
      const scheduledAt = scheduledDate
        ? toUtcIsoFromAppDateTime(scheduledDate, "09:00")
        : null;
      const created = await addTask(trimmed, scheduledAt, false, null, recipient ? { recipient } : undefined, "medium", undefined, {
        inbox,
      });
      if (created) onClose();
    } finally {
      setSaving(false);
    }
  };

  const form = (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-[#8E8E93] mb-1.5 block">Название</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Что нужно сделать?"
          className="w-full rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] px-4 py-3 text-white placeholder:text-[#8E8E93] outline-none focus:border-[#E25B21]"
          autoFocus={open}
        />
      </div>

      {mainView !== "completed" && (
        <div>
          <label className="text-sm text-[#8E8E93] mb-1.5 block">Дата (необязательно)</label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] px-4 py-3 text-white outline-none focus:border-[#E25B21] [color-scheme:dark]"
          />
        </div>
      )}

      {!isGuest ? (
        <div>
          <label className="text-sm text-[#8E8E93] mb-1.5 block">Исполнитель (необязательно)</label>
          <button
            type="button"
            onClick={() => setRecipientPickerOpen(true)}
            className="w-full flex items-center gap-3 rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] px-4 py-3 text-left hover:border-[#E25B21]"
          >
            <User className="h-5 w-5 shrink-0 text-[#8E8E93]" />
            <span className={`flex-1 truncate ${recipient ? "text-white" : "text-[#8E8E93]"}`}>
              {recipient ? recipientSelectionLabel(recipient) : "Себе — выбрать сотрудника, отдел или компанию"}
            </span>
            {recipient ? (
              <span
                role="button"
                tabIndex={0}
                aria-label="Убрать исполнителя"
                onClick={(e) => {
                  e.stopPropagation();
                  setRecipient(null);
                }}
                className="p-1 text-[#8E8E93] hover:text-white"
              >
                <X className="h-4 w-4" />
              </span>
            ) : (
              <ChevronRight className="h-5 w-5 shrink-0 text-[#8E8E93]" />
            )}
          </button>
        </div>
      ) : null}

      <button
        type="button"
        disabled={saving || !title.trim()}
        onClick={() => void handleSave()}
        className="w-full rounded-xl bg-[#E25B21] py-3.5 font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Сохранить
      </button>
    </div>
  );

  const picker = (
    <TaskRecipientPicker
      visible={recipientPickerOpen}
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

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="max-w-md border-[#3A3A3C] bg-[#1C1C1E] text-white sm:rounded-2xl [&>button]:text-[#8E8E93] [&>button]:hover:text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Новая задача</DialogTitle>
          </DialogHeader>
          {form}
        </DialogContent>
        {picker}
      </Dialog>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Закрыть" />
      <div className="relative bg-[#1C1C1E] rounded-t-2xl px-4 pt-3 pb-8 border-t border-[#3A3A3C]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Новая задача</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full bg-[#2C2C2E]" aria-label="Закрыть">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        {form}
      </div>
      {picker}
    </div>
  );
}
