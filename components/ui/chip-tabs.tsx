"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export type ChipTab<T extends string> = {
  value: T;
  label: string;
  /** Shown as a badge when greater than zero. */
  count?: number | null;
};

type ChipTabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  tabs: readonly ChipTab<T>[];
  ariaLabel: string;
  /**
   * `pills` — separate outlined pills that scroll sideways (phone);
   * `track` — tabs on one dark track (desktop toolbar).
   */
  variant?: "pills" | "track";
  /** id of the panel the tabs control. */
  controls?: string;
  className?: string;
};

/**
 * Tabs of a list with counters (Figma «Фильтры»: «Входящие 9», «Сегодня 2»). A tablist: the chosen
 * tab is reachable with Tab, arrows move between tabs, the badge reads with its tab.
 */
export function ChipTabs<T extends string>({
  value,
  onChange,
  tabs,
  ariaLabel,
  variant = "pills",
  controls,
  className,
}: ChipTabsProps<T>) {
  const refs = useRef(new Map<T, HTMLButtonElement>());
  const isTrack = variant === "track";

  const focusTab = (step: number) => {
    const index = tabs.findIndex((tab) => tab.value === value);
    const next = tabs[(index + step + tabs.length) % tabs.length];
    if (!next) return;
    onChange(next.value);
    refs.current.get(next.value)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex",
        isTrack
          ? "w-fit gap-1 rounded-xl bg-ui-surface p-1"
          : "-mx-4 gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          focusTab(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          focusTab(-1);
        }
      }}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        const count = tab.count ?? 0;
        return (
          <button
            key={tab.value}
            ref={(node) => {
              if (node) refs.current.set(tab.value, node);
              else refs.current.delete(tab.value);
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={controls}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
              isTrack
                ? "min-h-[33px] rounded-[9px] px-3.5 text-sm"
                : "min-h-10 rounded-full border px-[13px] text-[15px]",
              selected
                ? cn(
                    "bg-ui-accent-soft text-ui-accent-on-soft",
                    isTrack ? "font-semibold" : "border-transparent font-medium",
                  )
                : cn(
                    "font-medium text-ui-fg/60 hover:text-ui-fg/85",
                    isTrack ? "" : "border-ui-fg/10",
                  ),
            )}
          >
            {tab.label}
            {count > 0 ? (
              <span
                className={cn(
                  "min-w-5 rounded-lg px-1.5 text-center text-xs font-semibold leading-4",
                  selected ? "bg-ui-accent text-ui-fg" : "bg-ui-fg/[0.12] text-ui-fg/80",
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
