"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChoiceCardProps = {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  /** `radio` — one choice of the group, `checkbox` — any number of them; screen readers announce it. */
  kind: "radio" | "checkbox";
  /**
   * `row` — an option with its radio or checkbox (Figma «Выберите один вариант», «Можно выбрать
   * несколько»); `tile` — a large centered answer with an icon («Да / Нет»).
   */
  variant?: "row" | "tile";
  /** The icon of a tile. */
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
};

function Indicator({ kind, selected }: { kind: ChoiceCardProps["kind"]; selected: boolean }) {
  if (kind === "checkbox") {
    return (
      <span
        aria-hidden
        className={cn(
          "flex size-[22px] shrink-0 items-center justify-center rounded-4pt-xs",
          selected ? "bg-ui-accent text-ui-fg" : "border-2 border-ui-fg/40",
        )}
      >
        {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-[22px] shrink-0 items-center justify-center rounded-full border-2",
        selected ? "border-ui-accent" : "border-ui-fg/40",
      )}
    >
      {selected ? <span className="size-2.5 rounded-full bg-ui-accent" /> : null}
    </span>
  );
}

/**
 * A selectable answer card: the chosen one gets the accent border on the «selected» surface.
 * Put the cards of one question into an element with `role="radiogroup"` or `role="group"` and an
 * `aria-label`.
 */
export function ChoiceCard({
  selected,
  onSelect,
  children,
  kind,
  variant = "row",
  icon,
  disabled = false,
  className,
}: ChoiceCardProps) {
  const tile = variant === "tile";
  return (
    <button
      type="button"
      role={kind}
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center border text-ui-fg transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70 disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-ui-accent bg-ui-selected ring-1 ring-ui-accent" : "border-ui-fg/10 bg-ui-surface hover:bg-ui-fg/[0.06]",
        tile
          ? "min-h-[84px] justify-center gap-2.5 rounded-[18px] px-1.5 text-lg font-bold"
          : "min-h-[58px] gap-3.5 rounded-4pt-lg px-4 py-3 text-left text-base font-medium",
        className,
      )}
    >
      {tile ? (
        icon ? (
          <span
            aria-hidden
            className={cn("flex size-[22px] items-center justify-center [&_svg]:size-[22px]", selected ? "text-ui-accent" : "text-ui-fg/55")}
          >
            {icon}
          </span>
        ) : null
      ) : (
        <Indicator kind={kind} selected={selected} />
      )}
      <span className={tile ? undefined : "min-w-0 flex-1"}>{children}</span>
    </button>
  );
}
