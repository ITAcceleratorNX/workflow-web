"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ACCENT } from "./stats-ui";

export interface BarPoint {
  key: string;
  value: number;
  /** Подпись над столбцом; по умолчанию — значение, если оно больше нуля. */
  topLabel?: ReactNode;
  ariaLabel?: string;
}

/** Деления оси Y: 0…max с «круглым» шагом, не больше 4 делений. */
export function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  if (max <= 3) return Array.from({ length: Math.ceil(max) + 1 }, (_, i) => i);
  const rawStep = max / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? rawStep;
  const ticks: number[] = [];
  for (let v = 0; v < max + step; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/**
 * Столбчатый график из макета: подписи значений над столбцами, сетка, редкие подписи оси X.
 * С onSelect столбцы кликабельны: выбранный подсвечен, остальные приглушены, рядом — подсказка.
 */
export function BarChart({
  data,
  ticks,
  minValue = 0,
  xLabel,
  color = ACCENT,
  dimColor = "#7a3a22",
  height = 132,
  selectedIndex = null,
  onSelect,
  renderTooltip,
  barMaxWidth = 26,
}: {
  data: BarPoint[];
  ticks?: number[];
  minValue?: number;
  xLabel: (index: number) => string | null;
  color?: string;
  dimColor?: string;
  height?: number;
  selectedIndex?: number | null;
  onSelect?: (index: number | null) => void;
  renderTooltip?: (index: number) => ReactNode;
  barMaxWidth?: number;
}) {
  const max = Math.max(0, ...data.map((d) => d.value));
  const yTicks = ticks ?? niceTicks(max);
  const top = yTicks[yTicks.length - 1] || 1;
  const span = top - minValue || 1;
  const hasSelection = selectedIndex != null;

  return (
    <div className="relative select-none pt-6">
      <div className="flex">
        <div className="relative w-7 shrink-0" style={{ height }}>
          {yTicks.map((tick) => (
            <span
              key={tick}
              className="absolute right-2 -translate-y-1/2 text-[11px] text-white/50 tabular-nums"
              style={{ bottom: `${((tick - minValue) / span) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height }}>
          {yTicks.map((tick) => (
            <div
              key={tick}
              className="absolute inset-x-0 border-t border-white/[0.08]"
              style={{ bottom: `${((tick - minValue) / span) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-[6px]">
            {data.map((point, index) => {
              const empty = point.value <= 0;
              const ratio = Math.max(0, (point.value - minValue) / span);
              const isSelected = selectedIndex === index;
              const fill = empty ? "rgba(255,255,255,0.1)" : hasSelection && !isSelected ? dimColor : color;
              const label = point.topLabel ?? (point.value > 0 ? point.value : null);
              const bar = (
                <>
                  {label != null && (
                    <span className="mb-1 whitespace-nowrap text-center text-[11px] font-medium leading-tight text-white/80 tabular-nums">
                      {label}
                    </span>
                  )}
                  <span
                    className={cn("block w-full rounded-t-[3px]", isSelected && "ring-2 ring-white ring-offset-0")}
                    style={{ height: empty ? 3 : `max(3px, ${ratio * 100}%)`, backgroundColor: fill, maxWidth: barMaxWidth }}
                  />
                </>
              );
              const columnClass = "flex h-full min-w-0 flex-1 flex-col items-center justify-end";
              if (!onSelect || empty) {
                return <div key={point.key} className={columnClass} aria-label={point.ariaLabel}>{bar}</div>;
              }
              return (
                <button
                  key={point.key}
                  type="button"
                  aria-label={point.ariaLabel}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(isSelected ? null : index)}
                  className={cn(columnClass, "cursor-pointer focus-visible:outline-none [&:focus-visible>span:last-child]:ring-2 [&:focus-visible>span:last-child]:ring-white/70")}
                >
                  {bar}
                </button>
              );
            })}
          </div>
          {hasSelection && renderTooltip && selectedIndex! < data.length && (
            <div
              className="absolute top-0 z-10"
              style={
                (selectedIndex! + 0.5) / data.length > 0.5
                  ? { right: `${(1 - selectedIndex! / data.length) * 100}%`, marginRight: 8 }
                  : { left: `${((selectedIndex! + 1) / data.length) * 100}%`, marginLeft: 8 }
              }
            >
              {renderTooltip(selectedIndex!)}
            </div>
          )}
        </div>
      </div>
      <div className="ml-7 mt-2 flex gap-[6px]">
        {data.map((point, index) => (
          <span key={point.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[11px] text-white/50">
            {xLabel(index) ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}
