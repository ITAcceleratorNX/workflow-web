"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { addCalendarDaysToDateKey } from "@/lib/dateTimeUtils";
import { monthTitle, monthWeeks, WEEKDAY_SHORT_MON_FIRST, type MonthRef } from "@/lib/month-grid";
import { cn } from "@/lib/utils";

export type MonthGridDay = {
  key: string;
  day: number;
  /** Roving tab index: only one day of the month is in the Tab order. */
  tabIndex: 0 | -1;
};

type MonthGridProps = {
  month: MonthRef;
  /** Renders one day; give its focusable element `data-date={day.key}` and `tabIndex={day.tabIndex}`. */
  renderDay: (day: MonthGridDay) => ReactNode;
  /** The day that takes the Tab stop (the chosen one); the first day of the month without it. */
  focusKey?: string | null;
  className?: string;
  weekdayClassName?: string;
  /** Classes of each week row (gap between the cells). */
  weekClassName?: string;
};

/**
 * A month as a grid of days, Monday first (Figma «Месяц»). The look of a day belongs to the caller;
 * the grid gives the layout, the weekday names and keyboard moves: arrows by day and week,
 * Home/End to the ends of the week.
 */
export function MonthGrid({ month, renderDay, focusKey, className, weekdayClassName, weekClassName }: MonthGridProps) {
  const weeks = useMemo(() => monthWeeks(month), [month]);
  const ref = useRef<HTMLDivElement>(null);
  const keys = weeks.flat().filter((cell) => cell != null).map((cell) => cell.key);
  const tabKey = focusKey && keys.includes(focusKey) ? focusKey : keys[0];

  const focusDay = (key: string) => {
    const target = ref.current?.querySelector<HTMLElement>(`[data-date="${key}"]`);
    if (target && !target.hasAttribute("disabled")) target.focus();
  };

  return (
    <div
      ref={ref}
      role="grid"
      aria-label={monthTitle(month)}
      className={cn("flex flex-col", className)}
      onKeyDown={(event) => {
        const current = (event.target as HTMLElement).closest<HTMLElement>("[data-date]")?.dataset.date;
        if (!current) return;
        const weekday = (keys.indexOf(current) + (weeks[0].findIndex((cell) => cell != null))) % 7;
        const steps: Record<string, number> = {
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: -7,
          ArrowDown: 7,
          Home: -weekday,
          End: 6 - weekday,
        };
        const step = steps[event.key];
        if (step == null) return;
        event.preventDefault();
        const next = addCalendarDaysToDateKey(current, step);
        if (keys.includes(next)) focusDay(next);
      }}
    >
      <div role="row" className={cn("grid grid-cols-7", weekClassName)}>
        {WEEKDAY_SHORT_MON_FIRST.map((name) => (
          <span
            key={name}
            role="columnheader"
            className={cn("pb-1 text-center text-[11px] font-medium text-ui-fg/45", weekdayClassName)}
          >
            {name}
          </span>
        ))}
      </div>
      {weeks.map((week, index) => (
        <div key={index} role="row" className={cn("grid grid-cols-7", weekClassName)}>
          {week.map((cell, cellIndex) =>
            cell ? (
              <div key={cell.key} role="gridcell" className="min-w-0">
                {renderDay({ ...cell, tabIndex: cell.key === tabKey ? 0 : -1 })}
              </div>
            ) : (
              <div key={`empty-${cellIndex}`} role="gridcell" aria-hidden />
            ),
          )}
        </div>
      ))}
    </div>
  );
}
