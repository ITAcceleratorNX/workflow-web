"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, Plus, Users } from "lucide-react";
import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import {
  MANAGER_CABINET_CARDS,
  MANAGER_LEGACY_TAB_ROUTES,
} from "@/components/manager/cabinet/manager-cabinet-constants";
import { KpiCard } from "@/components/manager/statistics/desktop/stats-ui";
import { calculateManagerHomeKpi, managerKpiRequestHrefs } from "@/lib/manager-period";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStatsStore } from "@/stores/statsStore";

const ManagerHomeDashboard = dynamic(
  () => import("@/components/manager/home/manager-home-dashboard"),
  { ssr: false },
);

/** Desktop «Мой кабинет»: разделы и заявки за месяц. Вкладки статистики живут только в «Статистике». */
export function ManagerHomeDesktop() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAuthStore((s) => s.token);
  const { managerStats, fetchStats } = useStatsStore();
  const tab = searchParams.get("tab");
  const legacyRoute = tab ? MANAGER_LEGACY_TAB_ROUTES[tab] : undefined;
  // Ссылки из уведомлений и «Создать заявку» по-прежнему обрабатывает прежний экран.
  const deepLink = searchParams.has("requestId") || searchParams.get("createRequest") === "true";
  const [now] = useState(() => new Date());

  useEffect(() => {
    if (legacyRoute) router.replace(legacyRoute);
  }, [legacyRoute, router]);

  useEffect(() => {
    if (token && !deepLink) void fetchStats("manager");
  }, [token, deepLink, fetchStats]);

  const kpi = useMemo(() => calculateManagerHomeKpi(managerStats, "all", "month", now), [managerStats, now]);
  const hrefs = managerKpiRequestHrefs("/manager", "all", "month");

  if (deepLink) return <ManagerHomeDashboard />;
  if (legacyRoute) return null;

  return (
    <DesktopContentPage
      title="Мой кабинет"
      description="Обзор и управление"
      className="max-w-none lg:px-10 lg:pt-9"
      actions={
        <Link
          href="/create-request"
          className="flex h-10 items-center gap-2 rounded-[10px] bg-[#E85D2B] px-4 text-sm font-medium text-white transition-colors hover:bg-[#d4511f]"
        >
          <Plus className="h-4 w-4" />
          Создать заявку
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MANAGER_CABINET_CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group relative flex min-h-[148px] flex-col rounded-xl border border-white/10 bg-[#2c2c2e] p-5 transition-colors hover:bg-[#333336] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D2B]"
          >
            <card.icon className="mb-4 h-8 w-8 text-[#E85D2B]" strokeWidth={1.75} />
            <span className="text-base font-semibold text-white">{card.title}</span>
            <span className="mt-1 text-sm leading-snug text-white/50">{card.subtitle}</span>
            <ChevronRight className="absolute right-5 top-5 h-5 w-5 text-[#E85D2B]" />
          </Link>
        ))}
      </div>

      <div className="mb-4 mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Заявки за месяц</h2>
          <p className="mt-1 text-sm text-white/50">Все офисы · нажмите на карточку — откроется список заявок с этим фильтром</p>
        </div>
        <Link href="/manager/statistics" className="flex items-center gap-1 text-sm font-medium text-[#E85D2B] hover:underline">
          Вся статистика
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard tone="orange" icon={Clock} label="Экстренные" value={kpi.emergency} onClick={() => router.push(hrefs.new)} />
        <KpiCard tone="teal" icon={Users} label="В работе" value={kpi.inWork} onClick={() => router.push(hrefs.inWork)} />
        <KpiCard tone="green" icon={CheckCircle2} label="Завершено" value={kpi.completed} onClick={() => router.push(hrefs.completed)} />
        <KpiCard tone="red" icon={AlertTriangle} label="Просрочено" value={kpi.overdue} onClick={() => router.push(hrefs.overdue)} />
      </div>
    </DesktopContentPage>
  );
}
