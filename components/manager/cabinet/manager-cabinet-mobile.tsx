"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  MOBILE_PAGE_GRADIENTS,
} from "@/constants/mobile-layout";
import type { UseManagerCabinetResult } from "@/hooks/use-manager-cabinet";
import { MANAGER_CABINET_CARDS } from "./manager-cabinet-constants";

type ManagerCabinetMobileProps = UseManagerCabinetResult;

/** Mobile «Мой кабинет» — hub с карточками разделов. */
export function ManagerCabinetMobile({ isDesktop }: ManagerCabinetMobileProps) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: MOBILE_PAGE_GRADIENTS.plain,
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 lg:py-8">
        <h1 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-5 md:mb-6">
          Мой кабинет
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-4 lg:gap-5">
          {MANAGER_CABINET_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.key}
                href={card.href}
                className="block aspect-square min-h-0 min-w-0 active:scale-[0.98] transition-transform"
              >
                <Card className="relative h-full overflow-hidden border-0 shadow-lg bg-[#2C2C2E] group hover:bg-[#3A3A3C]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F35713]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-3 sm:p-4 md:p-4 relative z-10 flex flex-col h-full min-h-[100px] sm:min-h-[120px]">
                    <div className="mb-1 sm:mb-2 shrink-0">
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-[#F35713]" />
                    </div>
                    <h3 className="font-semibold text-white text-xs sm:text-sm leading-tight mb-0.5 sm:mb-1 line-clamp-2">
                      {card.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-[#8E8E93] leading-tight line-clamp-2 flex-1 min-h-0">
                      {card.subtitle}
                    </p>
                    <ChevronLeft className="absolute top-3 right-3 sm:top-4 sm:right-4 h-4 w-4 sm:h-5 sm:w-5 text-[#F35713] rotate-180 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
