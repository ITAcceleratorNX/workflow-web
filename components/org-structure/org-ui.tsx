"use client";

import type { ReactNode } from "react";
import { Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

/** Outline-кнопка на тёмной десктоп-странице (как в остальных разделах админки). */
export const DARK_OUTLINE_BUTTON_CLASS = "border-white/20 bg-transparent text-white hover:bg-white/10";

export function StatusBadge({ active, className }: { active: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        active ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-muted-foreground",
        className,
      )}
    >
      {active ? "Активна" : "Неактивна"}
    </span>
  );
}

export function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "accent" ? "bg-[rgba(243,87,19,0.18)] text-[#F35713]" : "bg-white/10 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/** Сегментный переключатель (статус и т.п.). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            value === o.value ? "bg-[#F35713] text-white" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Управление структурой и группами — только Desktop/Admin panel. */
export function DesktopOnlyNotice({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <Monitor className="h-9 w-9 text-[#F35713]" />
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Раздел доступен только в десктопной версии панели администратора.
      </p>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      {icon}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {text ? <p className="max-w-md text-sm text-muted-foreground">{text}</p> : null}
      {action}
    </div>
  );
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
