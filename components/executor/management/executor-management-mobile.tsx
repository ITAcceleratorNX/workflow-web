"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TasksSection } from "@/components/tasks/tasks-section";
import { EXECUTOR_CABINET_CARDS } from "@/components/executor/home/executor-home-constants";

/** Mobile hub — parity с workflow-mobile ExecutorCabinetScreen (layout даёт Header + BottomNav). */
export function ExecutorManagementMobile() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-1">Мой кабинет</h1>
      <p className="text-sm text-white/60 mb-6">Выберите раздел</p>

      <div className="grid grid-cols-2 gap-3">
        {EXECUTOR_CABINET_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.key}
              href={card.href}
              className="block aspect-square min-h-0 active:scale-[0.98] transition-transform"
            >
              <Card className="relative h-full overflow-hidden border-0 shadow-lg bg-[#2C2C2E] hover:bg-[#3A3A3C]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E25B21]/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-4 relative z-10 flex flex-col h-full min-h-[120px]">
                  <div className="mb-2 shrink-0">
                    <Icon className="h-8 w-8 text-[#E25B21]" />
                  </div>
                  <h3 className="font-semibold text-white text-sm leading-tight mb-1 line-clamp-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#8E8E93] leading-tight line-clamp-2 flex-1">
                    {card.subtitle}
                  </p>
                  <ChevronLeft className="absolute top-4 right-4 h-5 w-5 text-[#E25B21] rotate-180 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <TasksSection layout="embedded" />
    </div>
  );
}
