"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TaskMainView } from "@/lib/task-views";
import { toUtcIsoFromAppDateTime } from "@/lib/dateTimeUtils";
import type { UseTodoListResult } from "@/hooks/use-todo-list";

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

  useEffect(() => {
    if (!open) return;
    setTitle("");
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
    setSaving(true);
    try {
      const inbox = mainView === "inbox" && !scheduledDate;
      const scheduledAt = scheduledDate
        ? toUtcIsoFromAppDateTime(scheduledDate, "09:00")
        : null;
      await addTask(trimmed, scheduledAt, false, null, undefined, "medium", undefined, {
        inbox,
      });
      onClose();
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

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="max-w-md border-[#3A3A3C] bg-[#1C1C1E] text-white sm:rounded-2xl [&>button]:text-[#8E8E93] [&>button]:hover:text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Новая задача</DialogTitle>
          </DialogHeader>
          {form}
        </DialogContent>
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
    </div>
  );
}
