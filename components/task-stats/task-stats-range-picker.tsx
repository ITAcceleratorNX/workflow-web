"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthGrid } from "@/components/ui/month-grid";
import { addCalendarDaysToDateKey } from "@/lib/dateTimeUtils";
import { monthOfKey, monthTitle, shiftMonth, type MonthRef } from "@/lib/month-grid";
import {
  customPeriod,
  dayMonthLabel,
  monthPeriod,
  numericDate,
  periodLengthDays,
  rangeLabel,
  weekPeriod,
  type StatsPeriod,
} from "@/lib/task-stats";
import { cn } from "@/lib/utils";

const MAX_DAYS = 366;

type RangePickerProps = {
  initial: StatsPeriod;
  todayKey: string;
  onApply: (period: StatsPeriod) => void;
  onCancel: () => void;
  variant: "sheet" | "popover";
};

/**
 * «Свои даты» (Figma « Свои даты», « Выбор периода»): the start and the end on one month grid.
 * The active field takes the next tapped day; after the start the end is next. The period goes to
 * the screen only on «Показать» / «Применить».
 */
export function TaskStatsRangePicker({ initial, todayKey, onApply, onCancel, variant }: RangePickerProps) {
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [editing, setEditing] = useState<"from" | "to">("from");
  const [month, setMonth] = useState<MonthRef>(() => monthOfKey(initial.from));

  const pick = (key: string) => {
    if (editing === "from") {
      setFrom(key);
      if (key > to) setTo(key);
      setEditing("to");
    } else if (key < from) {
      setFrom(key);
    } else {
      setTo(key);
    }
  };

  const preset = (period: StatsPeriod) => {
    setFrom(period.from);
    setTo(period.to);
    setMonth(monthOfKey(period.from));
    setEditing("from");
  };

  const tooLong = periodLengthDays({ kind: "custom", from, to }) > MAX_DAYS;
  const apply = () => onApply(customPeriod(from, to));
  const sheet = variant === "sheet";

  const field = (which: "from" | "to", label: string, value: string) => (
    <button
      type="button"
      aria-pressed={editing === which}
      onClick={() => {
        setEditing(which);
        setMonth(monthOfKey(value));
      }}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-start rounded-xl border bg-ui-raised/70 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
        sheet ? "gap-0.5 px-3.5 py-2.5" : "px-3 py-2",
        editing === which ? "border-ui-accent" : "border-transparent",
      )}
    >
      <span className={sheet ? "text-xs text-ui-fg/55" : "sr-only"}>{label}</span>
      <span className={cn("truncate font-semibold text-ui-fg", sheet ? "text-base" : "text-[15px]")}>
        {sheet ? dayMonthLabel(value) : numericDate(value)}
      </span>
    </button>
  );

  const lastMonth = monthPeriod(addCalendarDaysToDateKey(monthPeriod(todayKey).from, -1));

  return (
    <div className="flex flex-col gap-4">
      {!sheet ? (
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Эта неделя", period: weekPeriod(todayKey) },
            { label: "Этот месяц", period: monthPeriod(todayKey) },
            { label: "Прошлый месяц", period: lastMonth },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => preset(item.period)}
              className="rounded-lg border border-ui-fg/15 px-2.5 py-1.5 text-[13px] text-ui-fg/85 hover:bg-ui-fg/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {sheet ? (
        <div className="flex gap-2.5">
          {field("from", "Начало", from)}
          {field("to", "Конец", to)}
        </div>
      ) : (
        <div className="flex gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span aria-hidden className="text-xs text-ui-fg/55">С</span>
            {field("from", "С", from)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span aria-hidden className="text-xs text-ui-fg/55">По</span>
            {field("to", "По", to)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Предыдущий месяц"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          className="flex size-9 items-center justify-center rounded-lg text-ui-accent hover:bg-ui-fg/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p className="text-[17px] font-semibold text-ui-fg" aria-live="polite">{monthTitle(month)}</p>
        <button
          type="button"
          aria-label="Следующий месяц"
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          className="flex size-9 items-center justify-center rounded-lg text-ui-accent hover:bg-ui-fg/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <MonthGrid
        month={month}
        focusKey={editing === "from" ? from : to}
        weekClassName="py-[3px]"
        weekdayClassName="pb-2 text-[13px]"
        renderDay={(day) => {
          const endpoint = day.key === from || day.key === to;
          const inside = day.key > from && day.key < to;
          const startsStrip = day.key === from && to > from;
          const endsStrip = day.key === to && to > from;
          return (
            <div
              className={cn(
                "relative",
                inside && "bg-ui-accent-soft",
                startsStrip && "bg-[linear-gradient(to_right,transparent_50%,hsl(var(--ui-accent-soft))_50%)]",
                endsStrip && "bg-[linear-gradient(to_left,transparent_50%,hsl(var(--ui-accent-soft))_50%)]",
              )}
            >
              <button
                type="button"
                data-date={day.key}
                tabIndex={day.tabIndex}
                aria-pressed={endpoint}
                aria-label={dayMonthLabel(day.key)}
                onClick={() => pick(day.key)}
                className={cn(
                  "relative mx-auto flex w-full items-center justify-center rounded-[10px] text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
                  sheet ? "h-10" : "h-9",
                  endpoint ? "bg-ui-accent font-bold text-ui-fg" : "text-ui-fg/90 hover:bg-ui-fg/[0.08]",
                  day.key === todayKey && !endpoint && "ring-1 ring-inset ring-ui-accent/80",
                )}
              >
                {day.day}
              </button>
            </div>
          );
        }}
      />

      {tooLong ? <p className="text-[13px] text-ui-danger">Период не может быть длиннее года</p> : null}

      {sheet ? (
        <div className="flex flex-col gap-2.5 pb-2">
          <Button variant="accent" className="h-12 rounded-xl text-[17px]" disabled={tooLong} onClick={apply}>
            Показать за {rangeLabel({ from, to })}
          </Button>
          <Button variant="raised" className="h-12 rounded-xl border border-ui-fg/10 bg-transparent text-[17px] font-medium" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      ) : (
        <div className="flex gap-2.5">
          <Button variant="raised" className="h-11 flex-1 rounded-xl border border-ui-fg/10 bg-transparent font-medium" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant="accent" className="h-11 flex-1 rounded-xl" disabled={tooLong} onClick={apply}>
            Применить
          </Button>
        </div>
      )}
    </div>
  );
}
