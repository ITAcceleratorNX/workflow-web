"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Sparkles, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EXECUTOR_CABINET_CARDS } from "@/components/executor/home/executor-home-constants";

/** Mobile hub — parity с workflow-mobile ExecutorCabinetScreen (layout даёт Header + BottomNav). */
export function ExecutorManagementMobile() {
  const router = useRouter();

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

      <section className="mt-6 pb-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Задачи</h2>
        <button
          type="button"
          onClick={() => router.push("/executor/requests")}
          className="w-full rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E85D2B]/20 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-[#E85D2B]" />
              </div>
              <div>
                <p className="text-white font-medium">Мои задачи</p>
                <p className="text-sm text-gray-400">Нажмите, чтобы открыть заявки</p>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-[#E85D2B]/60 shrink-0" />
          </div>
          <div className="h-2 rounded-full bg-[#E85D2B]/20 overflow-hidden">
            <div className="h-full w-0 bg-[#E85D2B] rounded-full" />
          </div>
        </button>
      </section>
    </div>
  );
}
