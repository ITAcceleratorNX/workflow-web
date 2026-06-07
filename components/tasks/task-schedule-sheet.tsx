"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarX,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Forward,
  Repeat,
  Sun,
  X,
} from "lucide-react";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  customPayload,
  defaultRecurrenceNone,
  formatEveryIntervalRu,
  formatRecurrenceSummaryCompactRu,
  getRecurrenceHighlightDateKeysForMonth,
  presetToPayload,
  RECURRENCE_PRESET_OPTIONS,
  type RecurrenceCustomUnit,
  type TaskRecurrencePayload,
} from "@/lib/task-recurrence";
import {
  buildMonthCells,
  formatDateLabelRu,
  MONTHS_NOMINATIVE,
  nextMondayAfterToday,
  nextWeekendDayKey,
  WEEKDAY_SHORT,
} from "@/lib/task-schedule-helpers";

function monthStartFromApiDateKey(dateKey: string): Date {
  const d = new Date(`${dateKey}T12:00:00`);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export type TaskScheduleSheetContentProps = {
  active: boolean;
  todayKey: string;
  tomorrowKey: string;
  scheduledDate: string | null;
  onScheduledDateChange: (dateKey: string | null) => void;
  scheduledTime: string;
  onScheduledTimeChange: (time: string) => void;
  calendarMonth: Date;
  onCalendarMonthChange: (d: Date) => void;
  onClosePress: () => void;
  onConfirmPress: () => void;
  recurrence: TaskRecurrencePayload;
  onRecurrenceChange: (next: TaskRecurrencePayload) => void;
};

export function TaskScheduleSheetContent({
  active,
  todayKey,
  tomorrowKey,
  scheduledDate,
  onScheduledDateChange,
  scheduledTime,
  onScheduledTimeChange,
  calendarMonth,
  onCalendarMonthChange,
  onClosePress,
  onConfirmPress,
  recurrence,
  onRecurrenceChange,
}: TaskScheduleSheetContentProps) {
  const background = useThemeColor("background");
  const cardBg = useThemeColor("cardBackground");
  const text = useThemeColor("text");
  const textMuted = useThemeColor("textMuted");
  const primary = useThemeColor("primary");
  const border = useThemeColor("border");

  const [repeatMenuOpen, setRepeatMenuOpen] = useState(false);
  const [customRepeatOpen, setCustomRepeatOpen] = useState(false);
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState<RecurrenceCustomUnit>("day");
  const [customWeekdays, setCustomWeekdays] = useState<number[]>([1]);

  useEffect(() => {
    if (!active) {
      setRepeatMenuOpen(false);
      setCustomRepeatOpen(false);
    }
  }, [active]);

  const openCustomEditor = useCallback(() => {
    if (recurrence.recurrence_type === "custom") {
      const n = Math.min(365, Math.max(1, recurrence.recurrence_interval ?? 1));
      setCustomInterval(n);
      setCustomUnit((recurrence.recurrence_custom_unit as RecurrenceCustomUnit) ?? "day");
      setCustomWeekdays(
        recurrence.recurrence_weekdays?.length ? [...recurrence.recurrence_weekdays] : [1],
      );
    } else {
      setCustomInterval(1);
      setCustomUnit("day");
      setCustomWeekdays([1]);
    }
    setRepeatMenuOpen(false);
    setCustomRepeatOpen(true);
  }, [recurrence]);

  const applyCustomRepeat = useCallback(() => {
    const n = Math.min(365, Math.max(1, customInterval));
    let wds = customUnit === "week" ? [...customWeekdays].sort((a, b) => a - b) : null;
    if (customUnit === "week" && (!wds || wds.length === 0)) wds = [1];
    onRecurrenceChange(customPayload(n, customUnit, wds));
    setCustomRepeatOpen(false);
  }, [customInterval, customUnit, customWeekdays, onRecurrenceChange]);

  const toggleWeekday = useCallback((wd: number) => {
    setCustomWeekdays((prev) => {
      const set = new Set(prev);
      if (set.has(wd)) {
        if (set.size <= 1) return prev;
        set.delete(wd);
      } else {
        set.add(wd);
      }
      return [...set].sort((a, b) => a - b);
    });
  }, []);

  const weekendShortcutKey = useMemo(() => nextWeekendDayKey(todayKey), [todayKey]);
  const nextWeekShortcutKey = useMemo(() => nextMondayAfterToday(todayKey), [todayKey]);

  const pickScheduledDate = useCallback(
    (dateKey: string | null) => {
      onScheduledDateChange(dateKey);
      if (dateKey) onCalendarMonthChange(monthStartFromApiDateKey(dateKey));
    },
    [onScheduledDateChange, onCalendarMonthChange],
  );

  const monthCells = useMemo(
    () => buildMonthCells(calendarMonth.getFullYear(), calendarMonth.getMonth()),
    [calendarMonth],
  );

  const recurrenceHighlightKeys = useMemo(() => {
    if (!scheduledDate || recurrence.recurrence_type === "none") return new Set<string>();
    return getRecurrenceHighlightDateKeysForMonth(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      scheduledDate,
      recurrence,
    );
  }, [scheduledDate, recurrence, calendarMonth]);

  const repeatDisabled = !scheduledDate;
  const repeatSummaryCompact = formatRecurrenceSummaryCompactRu(recurrence, {
    anchorDateKey: scheduledDate,
  });
  const customEveryTitle = formatEveryIntervalRu(customInterval, customUnit);

  if (customRepeatOpen) {
    return (
      <div className="flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCustomRepeatOpen(false);
              setRepeatMenuOpen(true);
            }}
            className="p-2 min-h-11"
          >
            <ChevronLeft className="h-6 w-6" style={{ color: text }} />
          </button>
          <span className="text-lg font-semibold truncate" style={{ color: text }}>
            Свой вариант
          </span>
          <button type="button" onClick={applyCustomRepeat} className="p-2 min-h-11">
            <Check className="h-6 w-6" style={{ color: primary }} />
          </button>
        </div>

        <div
          className="mx-4 mb-3 rounded-xl border px-4 py-3 text-center"
          style={{ backgroundColor: cardBg, borderColor: border }}
        >
          <span className="text-sm" style={{ color: textMuted }}>
            Каждые{" "}
          </span>
          <span className="font-semibold" style={{ color: primary }}>
            {customEveryTitle}
          </span>
        </div>

        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          <div className="flex gap-3">
            <select
              value={customInterval}
              onChange={(e) => setCustomInterval(Number(e.target.value))}
              className="flex-1 rounded-xl border px-3 py-3 text-base min-h-11"
              style={{ backgroundColor: cardBg, borderColor: border, color: text }}
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <select
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value as RecurrenceCustomUnit)}
              className="flex-1 rounded-xl border px-3 py-3 text-base min-h-11"
              style={{ backgroundColor: cardBg, borderColor: border, color: text }}
            >
              <option value="day">Дней</option>
              <option value="week">Недель</option>
              <option value="month">Месяцев</option>
            </select>
          </div>

          {customUnit === "week" ? (
            <div>
              <p className="text-xs font-semibold mb-2 tracking-wide" style={{ color: textMuted }}>
                ДНИ НЕДЕЛИ
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const).map((label, i) => {
                  const wd = i + 1;
                  const selected = customWeekdays.includes(wd);
                  return (
                    <button
                      key={wd}
                      type="button"
                      onClick={() => toggleWeekday(wd)}
                      className="w-10 h-10 rounded-lg border text-sm font-bold min-h-11"
                      style={{
                        borderColor: selected ? primary : border,
                        backgroundColor: selected ? primary : "transparent",
                        color: selected ? "#fff" : text,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <button type="button" onClick={onClosePress} className="p-2 min-h-11 min-w-11">
          <X className="h-6 w-6" style={{ color: text }} />
        </button>
        <span className="text-lg font-semibold" style={{ color: text }}>
          Срок
        </span>
        <button type="button" onClick={onConfirmPress} className="p-2 min-h-11 min-w-11">
          <Check className="h-6 w-6" style={{ color: primary }} />
        </button>
      </div>

      <div
        className="mx-4 mb-3 rounded-xl border px-4 py-3 text-center font-medium"
        style={{ backgroundColor: cardBg, borderColor: border, color: text }}
      >
        {formatDateLabelRu(scheduledDate)}
      </div>

      <div className="overflow-y-auto px-4 pb-6 flex-1">
        <ShortcutRow
          icon={<Sun className="h-5 w-5 text-[#F9A825]" />}
          label="Завтра"
          hint={WEEKDAY_SHORT[new Date(tomorrowKey + "T12:00:00").getDay()]}
          onClick={() => pickScheduledDate(tomorrowKey)}
          border={border}
          text={text}
          textMuted={textMuted}
        />
        <ShortcutRow
          icon={<Calendar className="h-5 w-5 text-[#42A5F5]" />}
          label="На выходных"
          hint={WEEKDAY_SHORT[new Date(weekendShortcutKey + "T12:00:00").getDay()]}
          onClick={() => pickScheduledDate(weekendShortcutKey)}
          border={border}
          text={text}
          textMuted={textMuted}
        />
        <ShortcutRow
          icon={<Forward className="h-5 w-5 text-[#AB47BC]" />}
          label="Следующая неделя"
          hint={WEEKDAY_SHORT[new Date(nextWeekShortcutKey + "T12:00:00").getDay()]}
          onClick={() => pickScheduledDate(nextWeekShortcutKey)}
          border={border}
          text={text}
          textMuted={textMuted}
        />
        <ShortcutRow
          icon={<CalendarX className="h-5 w-5" style={{ color: textMuted }} />}
          label="Без срока"
          onClick={() => {
            onScheduledDateChange(null);
            onRecurrenceChange(defaultRecurrenceNone());
          }}
          border={border}
          text={text}
          textMuted={textMuted}
        />

        <div className="flex items-center justify-between py-3">
          <button
            type="button"
            onClick={() => {
              const d = new Date(calendarMonth);
              d.setMonth(d.getMonth() - 1);
              onCalendarMonthChange(d);
            }}
            className="p-2 min-h-11"
          >
            <ChevronLeft className="h-7 w-7" style={{ color: text }} />
          </button>
          <span className="font-semibold" style={{ color: text }}>
            {MONTHS_NOMINATIVE[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => {
              const d = new Date(calendarMonth);
              d.setMonth(d.getMonth() + 1);
              onCalendarMonthChange(d);
            }}
            className="p-2 min-h-11"
          >
            <ChevronRight className="h-7 w-7" style={{ color: text }} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["П", "В", "С", "Ч", "П", "С", "В"].map((l, i) => (
            <div key={`${l}-${i}`} className="text-center text-xs py-1" style={{ color: textMuted }}>
              {l}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {monthCells.map((cell, idx) => {
            if (!cell.inMonth || !cell.dateKey) {
              return <div key={`e-${idx}`} className="aspect-square" />;
            }
            const selected = scheduledDate === cell.dateKey;
            const isToday = cell.dateKey === todayKey;
            const recurrenceHit = recurrenceHighlightKeys.has(cell.dateKey);
            const showRecurrenceRing = recurrenceHit && !selected;
            return (
              <button
                key={cell.dateKey}
                type="button"
                onClick={() => pickScheduledDate(cell.dateKey)}
                className="aspect-square rounded-lg flex items-center justify-center text-sm font-medium min-h-9"
                style={{
                  backgroundColor: selected ? primary : "transparent",
                  color: selected ? "#fff" : text,
                  borderWidth: showRecurrenceRing || (isToday && !selected) ? 1 : 0,
                  borderStyle: showRecurrenceRing ? "dotted" : "solid",
                  borderColor: primary,
                  fontWeight: recurrenceHit && !selected ? 700 : 400,
                }}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        <div
          className="flex items-center gap-3 rounded-xl border px-3 py-3 mb-2"
          style={{ borderColor: border }}
        >
          <Clock className="h-5 w-5 shrink-0" style={{ color: textMuted }} />
          <span className="flex-1" style={{ color: text }}>
            Время
          </span>
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => onScheduledTimeChange(e.target.value)}
            className="bg-transparent outline-none text-base min-h-10"
            style={{ color: textMuted }}
          />
        </div>

        <button
          type="button"
          disabled={repeatDisabled}
          onClick={() => !repeatDisabled && setRepeatMenuOpen(true)}
          className="w-full flex items-center gap-3 rounded-xl border px-3 py-3 min-h-11"
          style={{
            borderColor: border,
            opacity: repeatDisabled ? 0.45 : 1,
          }}
        >
          <Repeat className="h-5 w-5 shrink-0" style={{ color: textMuted }} />
          <span className="shrink-0" style={{ color: text }}>
            Повтор
          </span>
          <span className="flex-1 text-right text-sm truncate" style={{ color: textMuted }}>
            {repeatDisabled ? "Сначала дату" : repeatSummaryCompact}
          </span>
        </button>
      </div>

      {repeatMenuOpen ? (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setRepeatMenuOpen(false)}
            aria-label="Закрыть"
          />
          <div
            className="relative rounded-t-2xl px-4 pt-4 pb-8"
            style={{ backgroundColor: background }}
          >
            <p className="text-lg font-semibold mb-3" style={{ color: text }}>
              Повтор
            </p>
            {RECURRENCE_PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  if (opt.type === "custom") {
                    openCustomEditor();
                    return;
                  }
                  onRecurrenceChange(presetToPayload(opt.type));
                  setRepeatMenuOpen(false);
                }}
                className="w-full text-left py-3 border-b min-h-11"
                style={{ borderColor: border, color: text }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

type ShortcutRowProps = {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  border: string;
  text: string;
  textMuted: string;
};

function ShortcutRow({ icon, label, hint, onClick, border, text, textMuted }: ShortcutRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 border-b min-h-11"
      style={{ borderColor: border }}
    >
      {icon}
      <span className="flex-1 text-left" style={{ color: text }}>
        {label}
      </span>
      {hint ? (
        <span className="text-sm" style={{ color: textMuted }}>
          {hint}
        </span>
      ) : null}
    </button>
  );
}

type TaskScheduleSheetProps = {
  open: boolean;
  onClose: () => void;
} & Omit<TaskScheduleSheetContentProps, "active" | "onClosePress" | "onConfirmPress"> & {
    onConfirm: () => void;
  };

export function TaskScheduleSheet({
  open,
  onClose,
  onConfirm,
  ...contentProps
}: TaskScheduleSheetProps) {
  const background = useThemeColor("background");
  const primary = useThemeColor("primary");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex flex-col justify-end">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Закрыть" />
      <div
        className="relative rounded-t-2xl max-h-[90vh] flex flex-col"
        style={{ backgroundColor: background }}
      >
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <TaskScheduleSheetContent
          {...contentProps}
          active={open}
          onClosePress={onClose}
          onConfirmPress={onConfirm}
        />
      </div>
    </div>
  );
}
