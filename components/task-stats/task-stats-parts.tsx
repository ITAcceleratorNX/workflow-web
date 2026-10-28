"use client";

import { useRef, type ReactNode } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Info, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  chartTicks,
  initials,
  plural,
  share,
  SMALL_SAMPLE,
  type StatsPeriod,
  type TaskPriority,
  type TaskStats,
} from "@/lib/task-stats";
import { cn } from "@/lib/utils";

export const PRIORITY_LABEL: Record<TaskPriority, string> = { high: "Высокий", medium: "Средний", low: "Низкий" };
const PRIORITY_BAR: Record<TaskPriority, string> = { high: "bg-ui-danger", medium: "bg-amber-500", low: "bg-ui-done" };

/** One choice of two or three on a dark track, the chosen one solid accent (Figma «Моя / Сотрудники», «Неделя / Месяц / Свои даты» desktop). */
export function SolidTabs<T extends string>({
  value,
  options,
  onSelect,
  ariaLabel,
  size = "md",
  fill = false,
  className,
}: {
  value: T | null;
  options: readonly { value: T; label: string }[];
  onSelect: (value: T) => void;
  ariaLabel: string;
  size?: "md" | "lg";
  fill?: boolean;
  className?: string;
}) {
  const refs = useRef(new Map<T, HTMLButtonElement>());
  const move = (step: number) => {
    const index = Math.max(0, options.findIndex((o) => o.value === value));
    const next = options[(index + step + options.length) % options.length];
    onSelect(next.value);
    refs.current.get(next.value)?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex gap-1 rounded-xl border border-ui-fg/10 bg-ui-surface p-1", fill ? "w-full" : "w-fit", className)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              if (node) refs.current.set(option.value, node);
              else refs.current.delete(option.value);
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected || (value == null && option === options[0]) ? 0 : -1}
            onClick={() => onSelect(option.value)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
              size === "lg" ? "min-h-10 px-4 text-[17px]" : "min-h-[33px] px-3.5 text-sm",
              fill && "flex-1",
              selected ? "bg-ui-accent font-semibold text-ui-fg" : "font-medium text-ui-fg/65 hover:text-ui-fg/90",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** ‹ title › of a week or a month; own dates have no arrows. */
export function PeriodStepper({
  title,
  subtitle,
  canStep,
  onStep,
  className,
  titleClassName,
}: {
  title: string;
  subtitle?: string;
  canStep: boolean;
  onStep: (delta: -1 | 1) => void;
  className?: string;
  titleClassName?: string;
}) {
  const arrow = (delta: -1 | 1) =>
    canStep ? (
      <button
        type="button"
        aria-label={delta < 0 ? "Предыдущий период" : "Следующий период"}
        onClick={() => onStep(delta)}
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-ui-accent hover:bg-ui-fg/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
      >
        {delta < 0 ? <ChevronLeft className="size-5" aria-hidden /> : <ChevronRight className="size-5" aria-hidden />}
      </button>
    ) : (
      <span className="size-10 shrink-0" aria-hidden />
    );
  return (
    <div className={cn("flex items-center gap-1 rounded-xl bg-ui-surface px-1", className)}>
      {arrow(-1)}
      <div className="min-w-0 flex-1 py-1.5 text-center" aria-live="polite">
        <p className={cn("truncate font-semibold text-ui-fg", titleClassName)}>{title}</p>
        {subtitle ? <p className="truncate text-xs text-ui-fg/55">{subtitle}</p> : null}
      </div>
      {arrow(1)}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-ui-accent-soft font-semibold text-ui-accent-on-soft",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="px-0.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-ui-fg/45">{children}</h2>;
}

export function Meter({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div aria-hidden className={cn("h-2 overflow-hidden rounded-full bg-ui-fg/10", className)}>
      <div className={cn("h-full rounded-full bg-ui-accent", barClassName)} style={{ width: `${value * 100}%` }} />
    </div>
  );
}

/** Not completed, split into «в срок» (grey) and «просрочено» (red), as one bar. */
export function OpenSplitBar({ stats, className }: { stats: TaskStats; className?: string }) {
  const onTrack = share(stats.on_track, stats.not_completed);
  return (
    <div aria-hidden className={cn("flex h-2 gap-0.5 overflow-hidden rounded-full bg-ui-fg/10", className)}>
      {stats.on_track > 0 ? <div className="h-full bg-ui-fg/40" style={{ width: `${onTrack * 100}%` }} /> : null}
      {stats.overdue > 0 ? <div className="h-full flex-1 bg-ui-danger" /> : null}
    </div>
  );
}

/** «Всего 2 задачи на этой неделе — процент меняется от каждой задачи». */
export function smallSampleNote(stats: TaskStats, phrase: string): string | null {
  if (stats.total === 0 || stats.total >= SMALL_SAMPLE) return null;
  return `Всего ${stats.total} ${plural(stats.total, "задача", "задачи", "задач")} ${phrase} — процент меняется от каждой задачи`;
}

export function endedNote(stats: TaskStats): string | null {
  return stats.period.ended && stats.not_completed > 0 ? "Период закончился — все невыполненные задачи уже просрочены" : null;
}

export function InfoLine({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-[13px] text-ui-fg/55", className)}>
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** «Динамика выполнения»: completed tasks per day of the period, nothing invented for empty days. */
export function DailyChart({
  stats,
  period,
  height,
  withMonthTicks = false,
}: {
  stats: TaskStats;
  period: StatsPeriod;
  height: number;
  withMonthTicks?: boolean;
}) {
  const days = stats.daily;
  const max = Math.max(0, ...days.map((d) => d.completed));
  const total = days.reduce((sum, d) => sum + d.completed, 0);
  const ticks = chartTicks(period, days.length, withMonthTicks);
  const dense = days.length > 40;

  return (
    <div>
      {total === 0 ? (
        <div className="flex items-center justify-center border-b border-ui-fg/10 text-sm text-ui-fg/55" style={{ height }}>
          В этом периоде задачи не завершались
        </div>
      ) : (
        <div
          role="img"
          aria-label={`Завершено ${total} ${plural(total, "задача", "задачи", "задач")}, больше всего за день — ${max}`}
          className={cn("flex items-end", dense ? "gap-px" : "gap-[3px]")}
          style={{ height }}
        >
          {days.map((day) => (
            <div key={day.date} className="flex h-full min-w-0 flex-1 items-end justify-center" title={`${day.date}: ${day.completed}`}>
              {day.completed > 0 ? (
                <div
                  className={cn("w-full rounded-t-[3px] bg-ui-accent", !dense && "max-w-[10px]")}
                  style={{ height: `${Math.max(4, (day.completed / max) * 100)}%` }}
                />
              ) : (
                <div className={cn("h-[3px] w-full rounded-full bg-ui-fg/10", !dense && "max-w-[10px]")} />
              )}
            </div>
          ))}
        </div>
      )}
      <div aria-hidden className="relative mt-2 h-4 text-[11px] text-ui-fg/45">
        {ticks.map((tick, i) => {
          const left = ((tick.index + 0.5) / days.length) * 100;
          const edge = i === 0 ? "left" : i === ticks.length - 1 ? "right" : null;
          return (
            <span
              key={tick.index}
              className="absolute top-0 whitespace-nowrap"
              style={
                edge === "left" && period.kind !== "week"
                  ? { left: 0 }
                  : edge === "right" && period.kind !== "week"
                    ? { right: 0 }
                    : { left: `${left}%`, transform: "translateX(-50%)" }
              }
            >
              {tick.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** «По приоритетам»: completed of the tasks due in the period, per level. */
export function PriorityBars({ stats, compact = false }: { stats: TaskStats; compact?: boolean }) {
  if (stats.total === 0) return <p className="text-sm text-ui-fg/55">Нет задач со сроком в этом периоде</p>;
  return (
    <ul className={cn("flex flex-col", compact ? "gap-3.5" : "gap-4")}>
      {stats.priorities.map((p) => (
        <li key={p.priority} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className={cn("font-semibold text-ui-fg", compact ? "text-[15px]" : "text-[17px]")}>{PRIORITY_LABEL[p.priority]}</span>
            <span className={cn("text-ui-fg/55", compact ? "text-sm" : "text-[15px]")}>
              {p.total > 0 ? `${p.completed} из ${p.total}` : "нет задач"}
            </span>
          </div>
          {p.total > 0 ? <Meter value={share(p.completed, p.total)} barClassName={PRIORITY_BAR[p.priority]} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function StatsLoading({ className }: { className?: string }) {
  return (
    <div role="status" className={cn("flex flex-col items-center justify-center gap-3 py-16 text-ui-fg/55", className)}>
      <Loader2 className="size-7 animate-spin text-ui-accent" aria-hidden />
      <p className="text-sm">Загружаем статистику…</p>
    </div>
  );
}

/** Network failure or no access: a message only, never the numbers of another filter. */
export function StatsError({ reason, onRetry, className }: { reason: "forbidden" | "failed"; onRetry: () => void; className?: string }) {
  return reason === "forbidden" ? (
    <EmptyState
      className={cn("py-16", className)}
      icon={<Lock />}
      title="Нет доступа"
      description="Статистика этого сотрудника вам недоступна"
    />
  ) : (
    <EmptyState
      className={cn("py-16", className)}
      icon={<AlertCircle />}
      title="Не удалось загрузить статистику"
      description="Проверьте подключение к интернету и попробуйте ещё раз"
      action={
        <Button variant="raised" className="mt-2 rounded-xl" onClick={onRetry}>
          Повторить
        </Button>
      }
    />
  );
}
