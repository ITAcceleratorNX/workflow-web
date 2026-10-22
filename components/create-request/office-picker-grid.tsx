"use client";

import { useState } from "react";
import { Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickerOffice {
  id: number;
  name: string;
  city?: string | null;
  address?: string | null;
  block?: string | null;
  floor?: number | string | null;
  photo?: string | null;
}

function pluralOffices(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "офис";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "офиса";
  return "офисов";
}

/** «Блок 1 · 1 этаж» — из полей офиса, пусто, если их нет. */
export function officePlaceLine(office: Pick<PickerOffice, "block" | "floor">): string {
  const block = office.block?.toString().trim();
  const floor = office.floor?.toString().trim();
  return [block ? `Блок ${block}` : null, floor ? `${floor} этаж` : null].filter(Boolean).join(" · ");
}

/** Офисы по городам в исходном порядке; без города — «Другие». */
export function groupOfficesByCity<T extends PickerOffice>(offices: T[]): { city: string; offices: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const office of offices) {
    const city = office.city?.trim() || "Другие";
    groups.set(city, [...(groups.get(city) ?? []), office]);
  }
  return [...groups].map(([city, list]) => ({ city, offices: list }));
}

/** Фото офиса; без фото или при ошибке загрузки — заглушка с иконкой здания. */
function OfficePhoto({ office }: { office: PickerOffice }) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = office.photo?.trim() || null;
  if (!src || failed === src) {
    return (
      <div className="flex h-28 w-full items-center justify-center bg-[#222222]">
        <Building2 className="h-7 w-7 text-white/35" aria-hidden />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- внешние фото офисов, onError нужен для заглушки
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className="h-28 w-full bg-[#222222] object-cover"
      onError={() => setFailed(src)}
    />
  );
}

/**
 * Выбор офиса карточками (макет «Создать заявку — 1. Офис»): по городам, фото, адрес, блок и этаж.
 * Те же карточки, что в приложении (`workflow-mobile/components/requests/office-picker-grid.tsx`).
 */
export function OfficePickerGrid<T extends PickerOffice>({
  offices,
  selectedId,
  onSelect,
}: {
  offices: T[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="space-y-[18px]">
      {groupOfficesByCity(offices).map((group) => (
        <section key={group.city} className="space-y-3.5" aria-label={group.city}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-white/70">
            {group.city} · {group.offices.length} {pluralOffices(group.offices.length)}
          </h3>
          <div role="radiogroup" className="grid grid-cols-2 gap-[13px] sm:grid-cols-3 lg:grid-cols-4">
            {group.offices.map((office) => {
              const selected = selectedId === office.id;
              const place = officePlaceLine(office);
              return (
                <button
                  key={office.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelect(office.id)}
                  title={[office.name, office.address].filter(Boolean).join(", ")}
                  className={cn(
                    "flex min-w-0 flex-col overflow-hidden rounded-[18px] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#040404]",
                    selected
                      ? "border-2 border-[#E35B21] bg-[#E35B21]/[0.18]"
                      : "border border-white/20 bg-white/10 hover:bg-white/[0.14]",
                  )}
                >
                  <OfficePhoto office={office} />
                  <div className="flex min-w-0 flex-col gap-[5px] px-[11px] pb-[13px] pt-[11px]">
                    <span className="line-clamp-2 text-[15px] font-semibold leading-[19px] text-white">
                      {office.name}
                    </span>
                    {office.address && (
                      <span className="flex min-w-0 items-center gap-[3px] text-xs text-white/[0.78]">
                        <MapPin className="h-3 w-3 shrink-0 text-white/70" aria-hidden />
                        <span className="truncate">{office.address}</span>
                      </span>
                    )}
                    {place && <span className="text-[11px] font-medium text-white/55">{place}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
