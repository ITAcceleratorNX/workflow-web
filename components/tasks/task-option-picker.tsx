"use client";

import { Check, ChevronLeft } from "lucide-react";
import { TaskPickerShell, type TaskPickerVariant } from "@/components/tasks/task-picker-shell";
import { useTaskPickerTheme } from "@/hooks/use-task-picker-theme";
import { cn } from "@/lib/utils";

type TaskOptionPickerProps = {
  open: boolean;
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  /** Desktop: apply immediately with the chosen value */
  onApply?: (value: string) => void | Promise<void>;
  variant?: TaskPickerVariant;
};

export function TaskOptionPicker({
  open,
  title,
  options,
  selected,
  onSelect,
  onClose,
  onConfirm,
  onApply,
  variant = "sheet",
}: TaskOptionPickerProps) {
  const { text, primary, border } = useTaskPickerTheme(variant);
  const isDialog = variant === "dialog";

  const handleSelect = (value: string) => {
    onSelect(value);
    if (isDialog) {
      onClose();
      void onApply?.(value);
      return;
    }
  };

  const body = (
    <>
      {!isDialog && (
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: border }}>
          <button type="button" onClick={onClose} className="p-2 min-h-11">
            <ChevronLeft className="h-6 w-6" style={{ color: text }} />
          </button>
          <span className="text-lg font-semibold" style={{ color: text }}>
            {title}
          </span>
          <button type="button" onClick={onConfirm} className="p-2 min-h-11">
            <Check className="h-6 w-6" style={{ color: primary }} />
          </button>
        </div>
      )}
      <div className={cn("overflow-y-auto", isDialog ? "px-2 py-2" : "px-4 pb-8")}>
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "w-full flex items-center justify-between min-h-11 text-left transition-colors",
                isDialog
                  ? "rounded-xl px-4 py-3 mb-1 hover:bg-[#2C2C2E]"
                  : "py-3 border-b",
                isDialog && isSelected && "bg-[#E25B21]/15 ring-1 ring-[#E25B21]/40",
              )}
              style={isDialog ? undefined : { borderColor: border }}
            >
              <span style={{ color: text }}>{opt.label}</span>
              {isSelected ? <Check className="h-5 w-5 shrink-0" style={{ color: primary }} /> : null}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <TaskPickerShell
      open={open}
      onClose={onClose}
      variant={variant}
      title={isDialog ? title : undefined}
      maxWidthClass="max-w-md"
    >
      {body}
    </TaskPickerShell>
  );
}
