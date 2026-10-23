"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label?: ReactNode;
  icon?: ReactNode;
  /** Required when the option shows only an icon. */
  ariaLabel?: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  /** Name of the whole group for screen readers. */
  ariaLabel: string;
  /**
   * `accent` — the chosen option on accent-soft (view switch);
   * `neutral` — on a lighter surface (priority).
   */
  tone?: "accent" | "neutral";
  /** `fill` stretches the options to equal widths. */
  fill?: boolean;
  className?: string;
  optionClassName?: string;
};

/**
 * One choice of a few (Figma «Вид: список / календарь», «Приоритет»): a dark track with the chosen
 * option highlighted. A radio group for assistive technology, arrow keys move the choice.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  tone = "accent",
  fill = false,
  className,
  optionClassName,
}: SegmentedControlProps<T>) {
  const move = (step: number) => {
    const index = options.findIndex((option) => option.value === value);
    const next = options[(index + step + options.length) % options.length];
    if (next) onChange(next.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("flex gap-0.5 rounded-[11px] bg-ui-surface p-[3px]", fill && "w-full", className)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          move(1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex min-h-[30px] items-center justify-center gap-1.5 rounded-[9px] px-[9px] text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
              fill && "flex-1",
              selected
                ? tone === "accent"
                  ? "bg-ui-accent-soft text-ui-accent-on-soft"
                  : "bg-ui-fg/[0.13] font-semibold text-ui-fg"
                : "text-ui-fg/60 hover:text-ui-fg/85 [&_svg]:opacity-90",
              optionClassName,
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
