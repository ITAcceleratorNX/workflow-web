"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Clock, Repeat } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { MonthGrid } from "@/components/ui/month-grid";
import { OptionList } from "@/components/ui/option-list";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { monthOfKey, monthTitle, sameMonth, shiftMonth, type MonthRef } from "@/lib/month-grid";
import { DEFAULT_DUE_TIME, formatDayShort, quickDueOptions, type TaskDue } from "@/lib/task-due";
import {
  defaultRecurrenceNone,
  formatRecurrenceSummaryCompactRu,
  presetToPayload,
  RECURRENCE_PRESET_OPTIONS,
  type RecurrenceType,
  type TaskRecurrencePayload,
} from "@/lib/task-recurrence";
import { cn } from "@/lib/utils";

export type DueValue = { due: TaskDue | null; recurrence: TaskRecurrencePayload };

type TaskDueEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DueValue;
  onApply: (value: DueValue) => void;
  todayKey: string;
  /** `popover` — under a desktop field (the field is `children`); `sheet` — a phone sheet. */
  variant: "sheet" | "popover";
  children?: ReactNode;
};

const PRESETS = RECURRENCE_PRESET_OPTIONS.filter((item) => item.type !== "custom");

/**
 * «Срок» (Figma «Задачи · Срок»): quick days, a month without past days, the time and the repeat.
 * Changes are a draft until «Готово»; closing otherwise keeps the previous «Срок».
 */
export function TaskDueEditor({ open, onOpenChange, value, onApply, todayKey, variant, children }: TaskDueEditorProps) {
  const [draft, setDraft] = useState(value);
  const [month, setMonth] = useState<MonthRef>(() => monthOfKey(value.due?.dateKey ?? todayKey));
  const [repeatOpen, setRepeatOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setMonth(monthOfKey(value.due?.dateKey ?? todayKey));
    setRepeatOpen(false);
    // Reset only when the editor opens; `value` may change identity while it is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const apply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const panel = (
    <DuePanel
      draft={draft}
      onDraftChange={setDraft}
      month={month}
      onMonthChange={setMonth}
      todayKey={todayKey}
      repeatOpen={repeatOpen}
      onRepeatOpenChange={setRepeatOpen}
    />
  );

  if (variant === "popover") {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        {/* A field mid-card often has less room above and below than the month needs: keep to it, scroll the month. */}
        <PopoverContent
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="flex max-h-[var(--radix-popover-content-available-height)] w-[360px] flex-col gap-4 rounded-2xl border-ui-fg/[0.12] bg-ui-popover p-4 text-ui-fg shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
        >
          <div className="-m-1 min-h-0 overflow-y-auto overscroll-contain p-1">{panel}</div>
          <div className="flex shrink-0 justify-end gap-2">
            <Button variant="raised" size="md" className="h-9 px-4 text-sm" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button variant="accent" size="md" className="h-9 px-4 text-sm" onClick={apply}>
              Готово
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Срок" action={{ label: "Готово", onClick: apply }}>
      {panel}
    </BottomSheet>
  );
}

type DuePanelProps = {
  draft: DueValue;
  onDraftChange: (value: DueValue) => void;
  month: MonthRef;
  onMonthChange: (month: MonthRef) => void;
  todayKey: string;
  repeatOpen: boolean;
  onRepeatOpenChange: (open: boolean) => void;
};

function DuePanel({ draft, onDraftChange, month, onMonthChange, todayKey, repeatOpen, onRepeatOpenChange }: DuePanelProps) {
  const timeId = useId();
  const repeatListRef = useRef<HTMLDivElement>(null);
  const quick = quickDueOptions(todayKey);
  const selectedKey = draft.due?.dateKey ?? null;
  const time = draft.due?.time ?? DEFAULT_DUE_TIME;
  const firstMonth = monthOfKey(todayKey);
  const recurrence = draft.recurrence;
  const repeatValue: string = recurrence.recurrence_type;
  const repeatOptions = [
    ...PRESETS.map((item) => ({ value: item.type as string, label: item.type === "none" ? "Не повторять" : item.label })),
    ...(recurrence.recurrence_type === "custom"
      ? [{ value: "custom", label: formatRecurrenceSummaryCompactRu(recurrence, { anchorDateKey: selectedKey ?? todayKey }) }]
      : []),
  ];
  const repeatLabel = repeatOptions.find((item) => item.value === repeatValue)?.label ?? "Не повторять";

  // The list opens under the visible part of a scrolled popover or sheet.
  useEffect(() => {
    if (repeatOpen) repeatListRef.current?.scrollIntoView({ block: "nearest" });
  }, [repeatOpen]);

  const chooseDay = (dateKey: string | null) => {
    if (dateKey == null) {
      onDraftChange({ due: null, recurrence: defaultRecurrenceNone() });
      return;
    }
    onDraftChange({ ...draft, due: { dateKey, time } });
    const target = monthOfKey(dateKey);
    if (!sameMonth(target, month)) onMonthChange(target);
  };

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Быстрый выбор" className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none]">
        {quick.map((option) => {
          const active = option.dateKey === selectedKey;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => chooseDay(option.dateKey)}
              className={cn(
                "min-h-[33px] shrink-0 rounded-2xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
                active ? "bg-ui-accent-soft text-ui-accent-on-soft" : "bg-ui-raised text-ui-fg/85 hover:text-ui-fg",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between pb-1.5">
          <p className="text-base font-semibold text-ui-fg" aria-live="polite">
            {monthTitle(month)}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onMonthChange(shiftMonth(month, -1))}
              disabled={sameMonth(month, firstMonth)}
              aria-label="Предыдущий месяц"
              className="flex size-9 items-center justify-center rounded-lg text-ui-accent hover:bg-ui-fg/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70 disabled:opacity-30"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onMonthChange(shiftMonth(month, 1))}
              aria-label="Следующий месяц"
              className="flex size-9 items-center justify-center rounded-lg text-ui-accent hover:bg-ui-fg/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>
        <MonthGrid
          month={month}
          focusKey={selectedKey ?? todayKey}
          weekdayClassName="text-xs"
          renderDay={(day) => {
            const past = day.key < todayKey;
            const selected = day.key === selectedKey;
            return (
              <button
                type="button"
                data-date={day.key}
                tabIndex={day.tabIndex}
                disabled={past}
                aria-pressed={selected}
                aria-label={`${formatDayShort(day.key)}${day.key === todayKey ? ", сегодня" : ""}`}
                onClick={() => chooseDay(day.key)}
                className={cn(
                  "mx-auto flex h-9 w-full max-w-[50px] items-center justify-center rounded-full text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
                  selected
                    ? "bg-ui-accent font-semibold text-ui-fg"
                    : past
                      ? "text-ui-fg/30"
                      : cn("text-ui-fg hover:bg-ui-fg/[0.08]", day.key === todayKey && "font-semibold text-ui-accent"),
                )}
              >
                {day.day}
              </button>
            );
          }}
        />
      </div>

      <ListGroup tone="raised">
        <div className="flex min-h-12 items-center gap-3 px-3.5 py-2">
          <Clock aria-hidden className="size-5 text-ui-fg/70" />
          <label htmlFor={timeId} className="flex-1 text-base text-ui-fg">
            Время
          </label>
          <input
            id={timeId}
            type="time"
            value={time}
            disabled={!draft.due}
            onChange={(event) => {
              if (draft.due && event.target.value) onDraftChange({ ...draft, due: { ...draft.due, time: event.target.value } });
            }}
            className="rounded-lg bg-black/40 px-3 py-1.5 text-base font-semibold text-ui-fg [color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70 disabled:opacity-40"
          />
        </div>
        <ListRow
          icon={<Repeat />}
          label="Повтор"
          value={draft.due ? repeatLabel : "Нужен срок"}
          disabled={!draft.due}
          aria-expanded={repeatOpen}
          onClick={() => onRepeatOpenChange(!repeatOpen)}
        />
      </ListGroup>
      {repeatOpen && draft.due ? (
        <div ref={repeatListRef}>
          <OptionList<string>
            ariaLabel="Повтор"
            value={repeatValue}
            options={repeatOptions}
            onChange={(type) => {
              if (type !== "custom") onDraftChange({ ...draft, recurrence: presetToPayload(type as RecurrenceType) });
              onRepeatOpenChange(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
