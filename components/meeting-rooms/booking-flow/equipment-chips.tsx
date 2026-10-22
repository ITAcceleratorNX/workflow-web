"use client";

import type { LucideIcon } from "lucide-react";
import { AirVent, Cast, Mic, Monitor, PenLine, Plug, Plus, Presentation, Star, Video } from "lucide-react";
import { equipmentIconKey, type EquipmentIconKey } from "@/lib/booking-flow";
import { cn } from "@/lib/utils";
import type { BookingTone } from "./booking-tone";

const ICONS: Record<EquipmentIconKey, LucideIcon> = {
  projector: Cast,
  screen: Monitor,
  video: Video,
  board: PenLine,
  flipchart: Presentation,
  audio: Mic,
  power: Plug,
  climate: AirVent,
  custom: Star,
};

export function EquipmentIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[equipmentIconKey(name)];
  return <Icon className={className} aria-hidden />;
}

/** Оснащение переговорной: чипы с иконками; `max` — показать первые N и «+ ещё». */
export function EquipmentChips({
  items,
  tone,
  max,
  className,
}: {
  items: readonly string[] | undefined;
  tone: BookingTone;
  max?: number;
  className?: string;
}) {
  if (!items?.length) return null;
  const shown = max ? items.slice(0, max) : items;
  const rest = items.length - shown.length;
  const chip =
    tone === "mobile"
      ? "border-white/30 bg-white/15 text-white"
      : "border-white/15 bg-[#2C2C2E] text-white";
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Оснащение">
      {shown.map((name) => (
        <li key={name} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm", chip)}>
          <EquipmentIcon name={name} className="h-4 w-4 shrink-0" />
          {name}
        </li>
      ))}
      {rest > 0 && (
        <li className={cn("inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm", chip)}>
          <Plus className="h-4 w-4" aria-hidden />
          ещё {rest}
        </li>
      )}
    </ul>
  );
}
