"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export type ChipTab<T extends string> = {
  value: T;
  label: string;
  /** Shown as a badge when greater than zero. */
  count?: number | null;
};

type ChipTabsVariant = "pills" | "track" | "solid";

type ChipTabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  tabs: readonly ChipTab<T>[];
  ariaLabel: string;
  /**
   * `pills` — separate outlined pills that scroll sideways (phone);
   * `track` — tabs on one dark track (desktop toolbar);
   * `solid` — filled chips that wrap to the next line, the chosen one in the accent color
   * (Figma «Опросы»: the «Статус» filter).
   */
  variant?: ChipTabsVariant;
  /** Size of `solid` chips: `lg` — 44 px on Mobile, `md` — 40 px on Desktop. */
  size?: "md" | "lg";
  /** id of the panel the tabs control. */
  controls?: string;
  className?: string;
};

const LIST_CLASSES: Record<ChipTabsVariant, string> = {
  pills: "-mx-4 gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  track: "w-fit gap-1 rounded-xl bg-ui-surface p-1",
  solid: "flex-wrap gap-2.5",
};

function chipClasses(variant: ChipTabsVariant, size: "md" | "lg", selected: boolean): string {
  switch (variant) {
    case "track":
      return cn(
        "min-h-[33px] rounded-[9px] px-3.5 text-sm",
        selected ? "bg-ui-accent-soft font-semibold text-ui-accent-on-soft" : "font-medium text-ui-fg/60 hover:text-ui-fg/85",
      );
    case "solid":
      return cn(
        "rounded-4pt-md",
        size === "lg" ? "min-h-11 px-4 text-base" : "min-h-10 px-3.5 text-[14.5px]",
        selected
          ? cn("bg-ui-accent text-ui-fg", size === "md" && "font-semibold")
          : "bg-ui-fg/[0.06] text-ui-fg/80 hover:text-ui-fg",
      );
    default:
      return cn(
        "min-h-10 rounded-full border px-[13px] text-[15px] font-medium",
        selected ? "border-transparent bg-ui-accent-soft text-ui-accent-on-soft" : "border-ui-fg/10 text-ui-fg/60 hover:text-ui-fg/85",
      );
  }
}

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
  size = "lg",
  controls,
  className,
}: ChipTabsProps<T>) {
  const refs = useRef(new Map<T, HTMLButtonElement>());

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
      className={cn("flex", LIST_CLASSES[variant], className)}
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
              chipClasses(variant, size, selected),
            )}
          >
            {tab.label}
            {count > 0 ? (
              <span
                className={cn(
                  "min-w-5 rounded-lg px-1.5 text-center text-xs font-semibold leading-4",
                  !selected ? "bg-ui-fg/[0.12] text-ui-fg/80" : variant === "solid" ? "bg-ui-fg/25 text-ui-fg" : "bg-ui-accent text-ui-fg",
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
