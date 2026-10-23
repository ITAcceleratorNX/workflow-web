"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { UseManagerCabinetResult } from "@/hooks/use-manager-cabinet";
import { MANAGER_MOBILE_CABINET_CARDS } from "./manager-cabinet-constants";

type ManagerCabinetMobileProps = UseManagerCabinetResult;

/** Mobile «Управление» — хаб с разделами Руководителя. */
export function ManagerCabinetMobile(_props: ManagerCabinetMobileProps) {
  return (
    <div className="min-h-screen">
      <div className="w-full px-4 pb-6 pt-4">
        <h1 className="text-[32px] font-bold leading-tight text-foreground">Управление</h1>
        <p className="mb-3 mt-3 text-[15px] text-[#8E8E93]">Выберите раздел</p>

        <div className="grid grid-cols-2 gap-3">
          {MANAGER_MOBILE_CABINET_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.key}
                href={card.href}
                className="relative flex min-h-[158px] flex-col rounded-[20px] bg-[#1C1C1E] p-4 pb-10 active:scale-[0.98] transition-transform"
              >
                <Icon className="mb-3 h-6 w-6 text-[#F35713]" />
                <h3 className="text-[15px] font-semibold leading-tight text-white">{card.title}</h3>
                <p className="mt-2 text-[13px] leading-snug text-[#8E8E93]">{card.subtitle}</p>
                <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-[#F35713]" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
