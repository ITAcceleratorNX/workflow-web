"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type OptionListItem<T extends string> = { value: T; label: string; icon?: ReactNode };

type OptionListProps<T extends string> = {
  value: T | null;
  onChange: (value: T) => void;
  options: readonly OptionListItem<T>[];
  ariaLabel: string;
  /** `raised` — inside a sheet (Figma «Сортировать по»); `compact` — a desktop menu. */
  variant?: "raised" | "compact";
  className?: string;
};

/**
 * One choice from a short list with a check mark on the chosen option (Figma «Сортировка»,
 * «Напоминание»). A radio group for assistive technology.
 */
export function OptionList<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  variant = "raised",
  className,
}: OptionListProps<T>) {
  const compact = variant === "compact";
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-col overflow-hidden",
        compact ? "gap-0.5" : "rounded-[14px] bg-ui-raised [&>*+*]:border-t [&>*+*]:border-ui-fg/[0.06]",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex w-full items-center gap-3 text-left text-ui-fg transition-colors focus-visible:outline-none",
              compact
                ? cn("min-h-9 rounded-lg px-2.5 text-sm hover:bg-ui-fg/[0.06] focus-visible:bg-ui-fg/[0.08]", selected && "bg-ui-fg/[0.06] font-semibold")
                : cn("min-h-12 px-3.5 py-3.5 text-base hover:bg-ui-fg/[0.04] focus-visible:bg-ui-fg/[0.06]", selected && "font-semibold"),
            )}
          >
            {option.icon ? (
              <span aria-hidden className="flex size-4 shrink-0 items-center justify-center text-ui-fg/70 [&_svg]:size-4">
                {option.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {selected ? (
              <Check aria-hidden className={cn("shrink-0", compact ? "size-[18px] text-ui-accent-on-soft" : "size-[22px] text-ui-accent")} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
