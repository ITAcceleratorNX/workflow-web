"use client";

import Link from "next/link";
import { ChevronRight, Monitor } from "lucide-react";
import { useMemo } from "react";
import { calculateDeskHeights } from "@/lib/meeting-room-desk-height";
import { usePedometerStore } from "@/stores/usePedometerStore";

/** Compact desk height card — parity с workflow-mobile SmartDeskCalculator variant="compact". */
export function SmartDeskCalculatorCompact() {
  const heightCm = usePedometerStore((s) => s.settings.heightCm);
  const weightKg = usePedometerStore((s) => s.settings.weightKg);

  const deskHeights = useMemo(() => {
    if (!heightCm) return null;
    return calculateDeskHeights(heightCm, weightKg > 0 ? weightKg : undefined);
  }, [heightCm, weightKg]);

  let subtitle: string;
  if (deskHeights) {
    subtitle = `Сидя ${deskHeights.sitting} см · Стоя ${deskHeights.standing} см`;
  } else if (heightCm) {
    subtitle = "Уточните рост (100–250 см) в «Шаги»";
  } else {
    subtitle = "Расчёт по росту и весу из «Шаги»";
  }

  return (
    <Link
      href="/meeting-rooms"
      className="mt-3 flex items-center gap-3 rounded-2xl border border-[#3A3A3C] px-4 py-3.5 active:opacity-90 transition-opacity"
      aria-label="Высота рабочего стола, подробнее"
    >
      <Monitor className="h-[22px] w-[22px] shrink-0 text-[#8E8E93]" />
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-white">Высота рабочего стола</p>
        <p className="text-sm text-[#8E8E93] line-clamp-2">{subtitle}</p>
      </div>
      <ChevronRight className="h-[22px] w-[22px] shrink-0 text-[#E25B21]" />
    </Link>
  );
}
