"use client";

import { useId } from "react";
import { ArrowDownUp } from "lucide-react";
import { TASK_SORT_OPTIONS, type TaskSortValue } from "@/lib/task-list-sort";
import { useTaskPickerTheme, type TaskPickerVariant } from "@/hooks/use-task-picker-theme";

export function TaskSortControl({ value, onChange, variant = "sheet" }: { value: TaskSortValue; onChange: (value: TaskSortValue) => void; variant?: TaskPickerVariant }) {
  const id = useId();
  const { text, textMuted, cardBg, border } = useTaskPickerTheme(variant);
  return (
    <div className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <label htmlFor={id} className="flex items-center gap-2 text-sm" style={{ color: textMuted }}>
        <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
        Сортировка
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const option = TASK_SORT_OPTIONS.find((item) => item.value === event.target.value);
          if (option) onChange(option.value);
        }}
        className="min-h-11 w-full min-w-0 rounded-xl border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:max-w-md"
        style={{ color: text, backgroundColor: cardBg, borderColor: border }}
      >
        {TASK_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}
