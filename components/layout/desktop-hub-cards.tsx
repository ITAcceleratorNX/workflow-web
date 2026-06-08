"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DesktopHubCard = {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
};

type DesktopHubCardsProps = {
  cards: DesktopHubCard[];
  columns?: 2 | 3 | 4;
  className?: string;
};

/** Card hub grid for desktop role homes (admin, executor, dept-head). */
export function DesktopHubCards({ cards, columns = 3, className }: DesktopHubCardsProps) {
  const colClass =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={cn("grid grid-cols-1 gap-4", colClass, className)}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.key}
            href={card.href}
            className="block group active:scale-[0.99] transition-transform"
          >
            <Card className="relative h-full overflow-hidden border border-white/10 shadow-md bg-[#2C2C2E] hover:bg-[#3A3A3C] transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E25B21]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-5 relative z-10 flex flex-col min-h-[140px]">
                <div className="mb-3 shrink-0">
                  <Icon className="h-8 w-8 text-[#E25B21]" />
                </div>
                <h3 className="font-semibold text-white text-base leading-tight mb-1 line-clamp-2">
                  {card.title}
                </h3>
                <p className="text-sm text-[#8E8E93] leading-snug line-clamp-2 flex-1">
                  {card.subtitle}
                </p>
                <ChevronRight className="absolute top-5 right-5 h-5 w-5 text-[#E25B21] shrink-0" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
