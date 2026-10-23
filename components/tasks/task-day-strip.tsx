"use client";

import { useEffect, useRef } from "react";
import type { CalendarStripDay } from "@/hooks/use-client-tasks-page";
import { formatDayShort } from "@/lib/task-due";
import { scrollTaskStripToIndex, taskStripVisibleIndex } from "@/lib/task-calendar-strip";
import { cn } from "@/lib/utils";

type TaskDayStripProps = {
  days: CalendarStripDay[];
  selected: string;
  onSelect: (dateKey: string) => void;
  /** The day under the middle of the strip while it scrolls, for the month caption. */
  onVisibleChange: (dateKey: string) => void;
  monthLabel: string;
  ariaLabel: string;
};

/** A sideways strip of days for «Предстоящие» and «Выполненные»: the list shows the chosen day. */
export function TaskDayStrip({ days, selected, onSelect, onVisibleChange, monthLabel, ariaLabel }: TaskDayStripProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const index = days.findIndex((day) => day.key === selected);
    if (index < 0 || !ref.current) return;
    scrollTaskStripToIndex(ref.current, index, days.length);
    onVisibleChange(selected);
    // Scroll to the chosen day when it or the list of days changes, not on every caption update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, days]);

  return (
    <div className="flex flex-col gap-2">
      <p aria-live="polite" className="text-base font-bold capitalize text-ui-fg">
        {monthLabel}
      </p>
      <div
        ref={ref}
        role="radiogroup"
        aria-label={ariaLabel}
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(event) => {
          const element = event.currentTarget;
          const index = Math.min(days.length - 1, taskStripVisibleIndex(element.scrollLeft, element.clientWidth));
          const key = days[index]?.key;
          if (key) onVisibleChange(key);
        }}
      >
        {days.map((day) => {
          const active = day.key === selected;
          return (
            <button
              key={day.key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={formatDayShort(day.key)}
              onClick={() => onSelect(day.key)}
              className="flex w-[42px] shrink-0 flex-col items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
            >
              <span className={cn("text-[11px] font-semibold", active ? "text-ui-accent" : "text-ui-fg/50")}>{day.weekdayLabel}</span>
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-sm font-semibold",
                  active ? "bg-ui-accent text-ui-fg" : "text-ui-fg",
                )}
              >
                {day.dayNumber}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
