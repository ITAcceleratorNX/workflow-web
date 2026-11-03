"use client";

import { useId, useRef } from "react";
import { cn } from "@/lib/utils";

const VALUES = [1, 2, 3, 4, 5] as const;

type RatingScaleProps = {
  value: number | null;
  onChange: (value: number) => void;
  /** Labels under the ends of the scale, e.g. «Совсем неудобно» / «Очень удобно». */
  minLabel: string;
  maxLabel: string;
  /** Name of the scale for screen readers: the question. */
  ariaLabel: string;
  className?: string;
  /** Height of the values: 60 px on Mobile by default, 72 px on Desktop. */
  valueClassName?: string;
};

/**
 * A rating from 1 to 5 (Figma «Оценка 1–5»): five values in a row, the chosen one in the accent
 * color, labels of the ends under them. A radio group: arrow keys move the choice and the focus.
 */
export function RatingScale({ value, onChange, minLabel, maxLabel, ariaLabel, className, valueClassName }: RatingScaleProps) {
  const labelsId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const choose = (next: number) => {
    onChange(next);
    buttons.current[next - 1]?.focus();
  };

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-describedby={labelsId}
        className="flex gap-2"
        onKeyDown={(event) => {
          const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
          if (!step) return;
          event.preventDefault();
          choose(Math.min(5, Math.max(1, (value ?? (step > 0 ? 0 : 6)) + step)));
        }}
      >
        {VALUES.map((n) => {
          const selected = n === value;
          return (
            <button
              key={n}
              ref={(element) => {
                buttons.current[n - 1] = element;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (value == null && n === 1) ? 0 : -1}
              onClick={() => choose(n)}
              className={cn(
                "flex h-[60px] flex-1 items-center justify-center rounded-4pt-lg text-[22px] font-bold text-ui-fg transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
                selected ? "bg-ui-accent" : "border border-ui-fg/10 bg-ui-surface hover:bg-ui-fg/[0.06]",
                valueClassName,
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div id={labelsId} className="flex justify-between gap-3 text-[13px] text-ui-fg/55">
        <span>{minLabel}</span>
        <span className="text-right">{maxLabel}</span>
      </div>
    </div>
  );
}
