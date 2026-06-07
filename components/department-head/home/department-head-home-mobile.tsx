"use client";

import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { Card, CardContent } from "@/components/ui/card";
import type { UseDepartmentHeadHomeResult } from "@/hooks/use-department-head-home";
import { DEPARTMENT_HEAD_HOME_CARDS } from "./department-head-home-constants";

type DepartmentHeadHomeMobileProps = UseDepartmentHeadHomeResult;

/** Mobile home — parity с workflow-mobile ExecutorManagementScreen (department-head). */
export function DepartmentHeadHomeMobile({ handleRefresh }: DepartmentHeadHomeMobileProps) {
  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">Управление</h1>
            <Link
              href="/notifications"
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Уведомления"
            >
              <Bell className="w-6 h-6 text-white" />
            </Link>
          </div>
          <p className="text-sm text-white/60">Выберите раздел</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {DEPARTMENT_HEAD_HOME_CARDS.map((card) => {
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
                    <ChevronRight className="absolute top-4 right-4 h-5 w-5 text-[#E25B21] shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </PullToRefresh>
  );
}
