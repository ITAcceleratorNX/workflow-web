"use client";

import { ChevronRight } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ListGroupProps = {
  children: ReactNode;
  /**
   * `raised` — a group inside a sheet that already sits on the surface color;
   * `inset` — a dense group inside a desktop card (no lines between rows).
   */
  tone?: "surface" | "raised" | "inset";
  className?: string;
  "aria-label"?: string;
};

/** Grouped rows on one rounded card, separated by thin lines (Figma rows «Исполнитель», «Срок»). */
export function ListGroup({ children, tone = "surface", className, ...rest }: ListGroupProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl",
        tone !== "inset" && "[&>*+*]:border-t [&>*+*]:border-ui-fg/[0.06]",
        tone === "raised" ? "rounded-[14px] bg-ui-raised" : tone === "inset" ? "rounded-xl bg-ui-fg/[0.03] px-3.5 py-1" : "bg-ui-surface",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

type ListRowProps = {
  label: ReactNode;
  icon?: ReactNode;
  value?: ReactNode;
  /** Value color: `danger` for an overdue date. */
  valueTone?: "muted" | "danger" | "default";
  /** Label color: `accent` and `danger` rows are actions («Передать задачу», «Удалить»). */
  tone?: "default" | "accent" | "danger";
  onClick?: () => void;
  /** Shows the chevron of a row that opens something; true by default for clickable rows. */
  chevron?: boolean;
  /** Content at the end instead of the chevron (a check mark, a spinner). */
  trailing?: ReactNode;
  disabled?: boolean;
  /** Bold label of the chosen option. */
  selected?: boolean;
  /** `compact` — a 37 px row of a desktop card: muted label, bright value, no chevron. */
  density?: "regular" | "compact";
  className?: string;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "dialog" | "listbox" | "menu" | true;
};

/**
 * One row of a ListGroup: icon, label, value and chevron. A button when it has `onClick`; forwards
 * its ref, so it can open a popover (`PopoverTrigger asChild`).
 */
export const ListRow = forwardRef<HTMLButtonElement, ListRowProps>(function ListRow({
  label,
  icon,
  value,
  valueTone = "muted",
  tone = "default",
  onClick,
  chevron,
  trailing,
  disabled = false,
  selected = false,
  density = "regular",
  className,
  ...rest
}, ref) {
  const interactive = onClick != null;
  const compact = density === "compact";
  const showChevron = trailing == null && (chevron ?? (interactive && !compact));
  const content = (
    <>
      {icon ? (
        <span
          aria-hidden
          className={cn(
            "flex shrink-0 items-center justify-center",
            compact ? "size-4 [&_svg]:size-4" : "size-5 [&_svg]:size-5",
            tone === "default" ? (compact ? "text-ui-fg/55" : "text-ui-fg/70") : tone === "accent" ? "text-ui-accent" : "text-ui-danger",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-left",
          compact ? "text-sm" : "text-base",
          selected && "font-semibold",
          tone === "default" ? (compact ? "text-ui-fg/65" : "text-ui-fg") : tone === "accent" ? "text-ui-accent" : "text-ui-danger",
        )}
      >
        {label}
      </span>
      {value != null ? (
        <span
          className={cn(
            "max-w-[55%] truncate text-right",
            compact ? "text-sm font-medium" : "text-[15px]",
            valueTone === "danger" ? "text-ui-danger" : valueTone === "default" || compact ? "text-ui-fg" : "text-ui-fg/55",
          )}
        >
          {value}
        </span>
      ) : null}
      {trailing}
      {showChevron ? <ChevronRight aria-hidden className="size-5 shrink-0 text-ui-fg/35" /> : null}
    </>
  );
  const rowClass = cn(
    "flex items-center",
    compact
      ? "-mx-1.5 min-h-[37px] w-[calc(100%+0.75rem)] gap-2.5 rounded-lg px-1.5 py-2.5"
      : "min-h-12 w-full gap-3 py-3.5 pl-3.5 pr-3",
    className,
  );

  if (!interactive) {
    return (
      <div className={rowClass} {...rest}>
        {content}
      </div>
    );
  }
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        rowClass,
        "transition-colors hover:bg-ui-fg/[0.04] focus-visible:bg-ui-fg/[0.06] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      )}
      {...rest}
    >
      {content}
    </button>
  );
});

/** Small caption above a group («Приоритет», «Сортировать по»). */
export function ListGroupLabel({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <p id={id} className={cn("text-[13px] font-medium text-ui-fg/55", className)}>
      {children}
    </p>
  );
}
