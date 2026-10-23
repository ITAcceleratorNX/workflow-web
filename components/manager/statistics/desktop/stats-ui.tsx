"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Цвета показателей из макета («Компоненты · Статистика Руководителя»). */
export const KPI_TONES = {
  neutral: { border: "border-[#a1a1aa]/30", tile: "bg-[#a1a1aa]/20", icon: "text-[#a1a1aa]" },
  blue: { border: "border-[#3b82f6]/30", tile: "bg-[#3b82f6]/20", icon: "text-[#60a5fa]" },
  teal: { border: "border-[#2a9d8f]/30", tile: "bg-[#2a9d8f]/20", icon: "text-[#2a9d8f]" },
  green: { border: "border-[#10b981]/30", tile: "bg-[#10b981]/20", icon: "text-[#34d399]" },
  red: { border: "border-[#ef4444]/30", tile: "bg-[#ef4444]/20", icon: "text-[#f87171]" },
  orange: { border: "border-[#e85d2b]/30", tile: "bg-[#e85d2b]/20", icon: "text-[#e85d2b]" },
} as const;

export type KpiTone = keyof typeof KPI_TONES;

export const ACCENT = "#E85D2B";
export const RATING_COLOR = "#F5A623";
/** Цвета категорий в подсказках (точки), по порядку появления. */
export const CATEGORY_COLORS = ["#E85D2B", "#3B82F6", "#10B981", "#F5A623", "#A78BFA", "#F472B6", "#2A9D8F"];

export function formatHours(value: number | string | null | undefined): string {
  const n = Number(value);
  if (value == null || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} ч`;
}

export function formatRating(value: number | string | null | undefined): string {
  const n = Number(value);
  if (value == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** «1 оценка», «2 оценки», «5 оценок». */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function KpiCard({
  tone,
  icon: Icon,
  label,
  value,
  share,
  onClick,
  title,
}: {
  tone: KpiTone;
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  share?: string;
  onClick?: () => void;
  title?: string;
}) {
  const t = KPI_TONES[tone];
  const content = (
    <>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", t.tile)}>
        <Icon className={cn("h-[18px] w-[18px]", t.icon)} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs text-white/60">{label}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold leading-tight text-white tabular-nums">{value}</span>
          {share && <span className="text-[13px] font-medium text-white/50 tabular-nums">{share}</span>}
        </span>
      </span>
    </>
  );
  const className = cn(
    "flex min-w-0 items-center gap-3 rounded-xl border bg-[#2c2c2e] px-4 py-[21px] text-left",
    t.border,
  );
  if (!onClick) return <div className={className}>{content}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(className, "transition-colors hover:bg-[#333336] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D2B]")}
    >
      {content}
    </button>
  );
}

export function Panel({
  title,
  note,
  children,
  className,
}: {
  title: ReactNode;
  note?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-[#39393c] bg-[#2a2a2c] p-5", className)}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="min-w-0 truncate text-base font-semibold text-white">{title}</h2>
        {note && <span className="shrink-0 text-sm text-[#8e8e93]">{note}</span>}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  text: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.08]">
        <Icon className="h-6 w-6 text-white/70" strokeWidth={1.75} />
      </span>
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 max-w-[880px] text-sm text-white/50">{text}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Пустое состояние на всю ширину вкладки (рамка как у панели). */
export function EmptyPanel(props: Parameters<typeof EmptyState>[0]) {
  return (
    <div className="flex min-h-[360px] items-center rounded-xl border border-[#39393c] bg-[#2a2a2c]">
      <EmptyState {...props} className="w-full" />
    </div>
  );
}

export function ProgressBar({ value, max, color = ACCENT, className }: { value: number; max: number; color?: string; className?: string }) {
  const width = max > 0 ? Math.max(value > 0 ? 3 : 0, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded bg-white/[0.08]", className)}>
      <div className="h-full rounded" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  );
}

/** Строка «подпись — полоса — значение» (категории SLA, пиковые часы). */
export function BarRow({ label, value, max, display, color }: { label: ReactNode; value: number; max: number; display: ReactNode; color?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)_auto] items-center gap-4">
      <span className="truncate text-sm text-white">{label}</span>
      <ProgressBar value={value} max={max} color={color} className="h-1.5" />
      <span className="min-w-[3ch] text-right text-sm font-medium text-white tabular-nums">{display}</span>
    </div>
  );
}

export function LoadingBlock({ text = "Загрузка…" }: { text?: string }) {
  return (
    <div role="status" className="flex min-h-[240px] items-center justify-center rounded-xl border border-[#39393c] bg-[#2a2a2c] text-sm text-white/60">
      {text}
    </div>
  );
}

export function ErrorBlock({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-red-500/30 bg-[#2a2a2c] p-6 text-center">
      <p className="text-sm text-white">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-[10px] border border-white/20 bg-[#2c2c2e] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a3a3c]"
      >
        Повторить
      </button>
    </div>
  );
}
