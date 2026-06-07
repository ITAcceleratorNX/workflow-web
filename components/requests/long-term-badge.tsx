"use client";

import { LONG_TERM_LABEL } from "@/constants/requests";
import { cn } from "@/lib/utils";

type LongTermBadgeProps = {
  detail?: boolean;
  className?: string;
};

/** Parity с workflow-mobile LongTermBadge. */
export function LongTermBadge({ detail = false, className }: LongTermBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg bg-muted text-muted-foreground font-medium",
        detail ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[10px] font-semibold max-w-[88px] truncate",
        className,
      )}
    >
      {LONG_TERM_LABEL}
    </span>
  );
}
