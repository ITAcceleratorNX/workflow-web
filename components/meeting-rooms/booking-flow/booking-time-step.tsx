"use client";

import { AlertCircle, Check, ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import { formatDuration, formatTime, maskTimeInput } from "@/lib/booking-flow";
import { cn } from "@/lib/utils";
import { BOOKING_TONE, type BookingTone } from "./booking-tone";
import type { RoomBookingState } from "./use-room-booking";

function TimeField({
  label,
  value,
  onChange,
  invalid,
  tone,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  tone: BookingTone;
  autoFocus?: boolean;
}) {
  const t = BOOKING_TONE[tone];
  return (
    <label
      className={cn(
        "flex-1 rounded-2xl px-4 py-2.5 transition-colors focus-within:ring-0",
        t.field,
        invalid ? t.fieldError : t.fieldFocus,
      )}
    >
      <span className={cn("block text-xs", t.muted)}>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(maskTimeInput(event.target.value))}
        inputMode="numeric"
        autoComplete="off"
        placeholder="__:__"
        maxLength={5}
        aria-label={`Время «${label}»`}
        aria-invalid={invalid}
        autoFocus={autoFocus}
        className="w-full bg-transparent text-[28px] font-semibold leading-tight text-white outline-none placeholder:text-white/30"
      />
    </label>
  );
}

/** Шаг 1: день недели, время «С — До» по маске, занятость дня и свободные окна рядом. */
export function BookingTimeStep({ state, tone }: { state: RoomBookingState; tone: BookingTone }) {
  const t = BOOKING_TONE[tone];
  const { week, weekOffset, changeWeek, day, setDay, from, setFrom, to, setTo, check, busy, hours, suggestions } = state;
  const conflicts = !check.ok && check.reason === "busy" ? check.conflicts : [];
  const invalidTo = !check.ok && check.reason !== "incomplete" && to.length === 5;
  const invalidFrom = !check.ok && ["past", "hours", "step", "format"].includes(check.reason) && from.length === 5;

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className={cn("text-base font-semibold", t.label)}>Дата</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => changeWeek(-1)}
              disabled={weekOffset === 0}
              aria-label="Предыдущая неделя"
              className={cn("rounded-full p-1.5 disabled:opacity-30", t.secondary)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => changeWeek(1)}
              disabled={weekOffset >= 3}
              aria-label="Следующая неделя"
              className={cn("rounded-full p-1.5 disabled:opacity-30", t.secondary)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label="День брони">
          {week.map((d) => {
            const selected = d.date === day;
            return (
              <button
                key={d.date}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={d.disabled}
                onClick={() => setDay(d.date)}
                className={cn(
                  "flex flex-col items-center rounded-xl py-2 transition-colors disabled:opacity-35",
                  selected ? t.daySelected : t.dayIdle,
                )}
              >
                <span className="text-[11px] leading-none opacity-80">{d.weekday}</span>
                <span className="mt-1 text-lg font-semibold leading-none">{d.day}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className={cn("mb-2 text-base font-semibold", t.label)}>Время</h3>
        <div className="flex items-center gap-3">
          <TimeField label="С" value={from} onChange={setFrom} invalid={invalidFrom} tone={tone} />
          <span className={cn("text-xl", t.muted)}>—</span>
          <TimeField label="До" value={to} onChange={setTo} invalid={invalidTo} tone={tone} />
        </div>

        <div className="mt-2 min-h-[22px] text-sm" aria-live="polite">
          {state.availabilityLoading ? (
            <span className={cn("inline-flex items-center gap-1.5", t.muted)}>
              <Loader2 className="h-4 w-4 animate-spin" /> Проверяем занятость…
            </span>
          ) : state.availabilityError ? (
            <span className={cn("inline-flex items-center gap-1.5", t.error)}>
              <AlertCircle className="h-4 w-4" /> {state.availabilityError}
              <button type="button" onClick={state.retryAvailability} className="underline underline-offset-2">
                Повторить
              </button>
            </span>
          ) : check.ok ? (
            <span className={cn("inline-flex items-center gap-1.5 font-medium", t.success)}>
              <Check className="h-4 w-4" /> {formatDuration(check.duration)} · свободно
            </span>
          ) : check.reason === "incomplete" ? (
            <span className={cn("inline-flex items-center gap-1.5", t.muted)}>
              <Clock className="h-4 w-4" /> {check.message}
            </span>
          ) : (
            <span className={cn("inline-flex items-center gap-1.5 font-medium", t.error)}>
              <AlertCircle className="h-4 w-4" /> {check.message}
            </span>
          )}
        </div>
        <p className={cn("mt-1 text-xs", t.muted)}>
          Шаг 15 минут · от 15 мин до 2 ч · офис работает {formatTime(hours.start)}–{formatTime(hours.end)}
        </p>
      </section>

      {suggestions.length > 0 && (
        <section>
          <h3 className={cn("mb-2 text-sm", t.label)}>Свободно рядом:</h3>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((slot) => (
              <button
                key={`${slot.start}-${slot.end}`}
                type="button"
                onClick={() => state.pickSlot(slot)}
                className={cn("rounded-xl py-2.5 text-sm font-semibold", t.primary)}
              >
                {formatTime(slot.start)}–{formatTime(slot.end)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className={cn("mb-2 text-base font-semibold", t.label)}>Занято в этот день</h3>
        {busy.length === 0 ? (
          <p className={cn("text-sm", t.muted)}>
            {state.availabilityLoading ? "…" : `Свободно весь день, ${formatTime(hours.start)}–${formatTime(hours.end)}`}
          </p>
        ) : (
          <>
            <ul className="flex flex-wrap gap-2">
              {busy.map((b) => {
                const clash = conflicts.some((c) => c.start === b.start && c.end === b.end);
                return (
                  <li
                    key={`${b.start}-${b.end}`}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm",
                      t.busy,
                      clash && "ring-1 ring-[#FF6B6B]",
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B6B]" aria-hidden />
                    {formatTime(b.start)}–{formatTime(b.end)}
                  </li>
                );
              })}
            </ul>
            <p className={cn("mt-2 text-xs", t.muted)}>
              Остальное время с {formatTime(hours.start)} до {formatTime(hours.end)} свободно
            </p>
          </>
        )}
      </section>
    </div>
  );
}
