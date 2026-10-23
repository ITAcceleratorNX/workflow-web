"use client";

import type { ReactNode } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { OptionList, type OptionListItem } from "@/components/ui/option-list";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type TaskChoicePickerProps<T extends string> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: T | null;
  options: readonly OptionListItem<T>[];
  /** Called with the new choice; the picker closes itself. */
  onChange: (value: T) => void;
  /** `popover` — under a desktop field or row (it is `children`); `sheet` — a phone sheet. */
  variant: "sheet" | "popover";
  children?: ReactNode;
  align?: "start" | "end";
};

/** One choice for a task field («Напоминание», «Приоритет»): a phone sheet or a desktop menu. */
export function TaskChoicePicker<T extends string>({
  open,
  onOpenChange,
  title,
  value,
  options,
  onChange,
  variant,
  children,
  align = "start",
}: TaskChoicePickerProps<T>) {
  const choose = (next: T) => {
    onChange(next);
    onOpenChange(false);
  };

  if (variant === "popover") {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          align={align}
          sideOffset={8}
          className="w-[var(--radix-popover-trigger-width)] min-w-[220px] rounded-xl border-ui-fg/[0.12] bg-ui-popover p-1.5 text-ui-fg shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
        >
          <OptionList<T> variant="compact" ariaLabel={title} value={value} options={options} onChange={choose} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={title}>
      <OptionList<T> ariaLabel={title} value={value} options={options} onChange={choose} />
    </BottomSheet>
  );
}
