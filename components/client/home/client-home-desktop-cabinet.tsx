"use client";

import Link from "next/link";
import { ArrowRight, Heart, Home } from "lucide-react";
import { TasksSection } from "@/components/tasks/tasks-section";
import { ClientNewsCarousel } from "@/components/client/home/client-news-carousel";
import { useClientHomeNews } from "@/hooks/use-client-home-news";

/** Desktop client cabinet tab — news, smart control, tasks. */
export function ClientHomeDesktopCabinet() {
  const { items, loading } = useClientHomeNews();

  return (
    <div className="max-w-6xl mx-auto py-6 lg:py-8 client-desktop-dark space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Обзор дня</h1>
        <Link
          href="/client/news"
          className="inline-flex items-center gap-1 text-[#E85D2B] font-medium text-sm mt-1 hover:text-[#F35713]"
        >
          Все новости
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <ClientNewsCarousel items={items} loading={loading} variant="desktop" />

      <section>
        <h2 className="text-xl font-bold text-white mb-4">Smart Control</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/client/smart-home"
            className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5 flex flex-col gap-3 hover:bg-[#3A3A3C] transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E85D2B]/20 flex items-center justify-center">
              <Home className="w-7 h-7 text-[#E85D2B]" />
            </div>
            <span className="text-sm font-medium text-white leading-snug">
              Управление умным офисом
            </span>
          </Link>
          <Link
            href="/client/health"
            className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5 flex flex-col gap-3 hover:bg-[#3A3A3C] transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-[#60A5FA]/20 flex items-center justify-center">
              <Heart className="w-7 h-7 text-[#60A5FA]" />
            </div>
            <span className="text-sm font-medium text-white leading-snug">Health трекер</span>
          </Link>
          <Link
            href="/client/tasks"
            className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5 flex flex-col gap-3 hover:bg-[#3A3A3C] transition-colors hidden lg:flex"
          >
            <div className="w-12 h-12 rounded-xl bg-[#34D399]/20 flex items-center justify-center">
              <span className="text-[#34D399] font-bold text-lg">✓</span>
            </div>
            <span className="text-sm font-medium text-white leading-snug">Мои задачи</span>
          </Link>
        </div>
      </section>

      <TasksSection layout="embedded" />
    </div>
  );
}
