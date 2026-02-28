"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Building2,
  LayoutDashboard,
  BarChart3,
  Settings,
  UserPlus,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";

const cabinetCards = [
  {
    key: "meeting-rooms",
    title: "Переговорные",
    subtitle: "Бронирование и управление переговорными",
    icon: Building2,
    href: "/manager?tab=meeting-rooms",
  },
  {
    key: "overview",
    title: "Обзор",
    subtitle: "Распределение по типам и уведомления",
    icon: LayoutDashboard,
    href: "/manager?tab=overview",
  },
  {
    key: "analytics",
    title: "Аналитика",
    subtitle: "Отчёты и аналитика по заявкам",
    icon: BarChart3,
    href: "/manager?tab=analytics",
  },
  {
    key: "management",
    title: "Управление",
    subtitle: "Офисы, пользователи, категории",
    icon: Settings,
    href: "/manager?tab=management",
  },
  {
    key: "registration-requests",
    title: "Регистрации",
    subtitle: "Запросы на регистрацию пользователей",
    icon: UserPlus,
    href: "/manager?tab=registration-requests",
  },
  {
    key: "statistics",
    title: "Статистика",
    subtitle: "Детальная статистика и экспорт",
    icon: BarChart3,
    href: "/manager/statistics",
  },
];

export default function ManagerCabinetPage() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (isDesktop) {
      router.push("/manager");
    }
  }, [isDesktop, router]);

  return (
    <div className="min-h-screen bg-[#1C1C1E] pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-white mb-6">Мой кабинет</h1>

        <div className="grid grid-cols-2 gap-3">
          {cabinetCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.key}
                href={card.href}
                className="block aspect-square min-h-0"
              >
                <Card
                  className="relative h-full overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-0 shadow-lg bg-[#2C2C2E] group hover:bg-[#3A3A3C]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F35713]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-4 relative z-10 flex flex-col h-full min-h-[120px]">
                    <div className="mb-2 transform group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Icon className="h-8 w-8 text-[#F35713]" />
                    </div>
                    <h3 className="font-semibold text-white text-sm leading-tight mb-1 line-clamp-2">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#8E8E93] leading-tight line-clamp-2 flex-1">
                      {card.subtitle}
                    </p>
                    <ChevronLeft className="absolute top-4 right-4 h-5 w-5 text-[#F35713] rotate-180 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <BottomNav activeTab="home" />
    </div>
  );
}
