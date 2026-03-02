"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  FolderTree,
  Users,
  Building2,
  Home,
  ChevronLeft,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

const managementCards = [
  {
    key: "categories",
    title: "Категории и подкатегории",
    subtitle: "Добавление и удаление категорий",
    icon: FolderTree,
    href: "/admin-worker/management/categories",
  },
  {
    key: "users",
    title: "Пользователи",
    subtitle: "Роли и запросы на регистрацию",
    icon: Users,
    href: "/admin-worker/management/users",
  },
  {
    key: "office",
    title: "Офис",
    subtitle: "Кабинеты, переговорные, адреса",
    icon: Building2,
    href: "/admin-worker/management/office",
  },
  {
    key: "smart-home",
    title: "Умный дом",
    subtitle: "Устройства и доступ",
    icon: Home,
    href: "/admin-worker/management/smart-home",
  },
  {
    key: "statistics",
    title: "Статистика",
    subtitle: "Отчёты и аналитика по заявкам",
    icon: BarChart3,
    href: "/admin-worker/statistics",
  },
];

export default function ManagementPage() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className={`w-full min-h-[calc(100vh-90px)] ${isDesktop ? "bg-[#1A1A1A]" : "bg-[#1C1C1E]"}`}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-white mb-6">Управление</h1>

      <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-3 md:grid-rows-2">
        {managementCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.key}
              href={card.href}
              className="block aspect-square min-h-0 md:aspect-auto md:min-h-[160px]"
            >
              <Card
                className="relative h-full overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/10 shadow-lg bg-[#2C2C2E] group hover:bg-[#3A3A3C] hover:border-[#E85D2B]/30"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#E85D2B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-4 relative z-10 flex flex-col h-full min-h-[120px]">
                  <div className="mb-2 transform group-hover:scale-110 transition-transform duration-300 shrink-0">
                    <Icon className="h-8 w-8 text-[#E85D2B]" />
                  </div>
                  <h3 className="font-semibold text-white text-sm leading-tight mb-1 line-clamp-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-white/60 leading-tight line-clamp-2 flex-1">
                    {card.subtitle}
                  </p>
                  <ChevronLeft className="absolute top-4 right-4 h-5 w-5 text-[#E85D2B] rotate-180 shrink-0" />
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
