"use client";

import { cn } from "@/lib/utils";

export interface StatRowProps {
  label: string;
  value: number | string;
  valueClassName?: string;
  className?: string;
}

/** Строка статистики label / value (workflow-mobile StatRow). */
export function StatRow({ label, value, valueClassName, className }: StatRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mb-4pt-md last:mb-0",
        className
      )}
    >
      <span className="text-[15px] text-muted-foreground">{label}</span>
      <span className={cn("text-base font-semibold text-foreground", valueClassName)}>
        {value}
      </span>
    </div>
  );
}
