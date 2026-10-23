"use client";

import { Fragment, useState } from "react";
import PullToRefresh from "@/components/pull-to-refresh";
import { useManagerStatisticsPage } from "@/hooks/use-manager-statistics-page";
import { cn } from "@/lib/utils";
import { CategoriesTab } from "./desktop/categories-tab";
import { OverviewTab } from "./desktop/overview-tab";
import { RatingsTab } from "./desktop/ratings-tab";
import { RoomsTab } from "./desktop/rooms-tab";
import { SlaTab } from "./desktop/sla-tab";
import { StatisticsToolbar } from "./desktop/statistics-toolbar";

const TABS = [
  { key: "overview", label: "Обзор", Component: OverviewTab },
  { key: "sla", label: "Сроки (SLA)", Component: SlaTab },
  { key: "ratings", label: "Оценки", Component: RatingsTab },
  { key: "categories", label: "Категории и исполнители", Component: CategoriesTab },
  // Переговорные — бывшая вкладка «Загрузка»; отделена чертой, т.к. это не заявки.
  { key: "rooms", label: "Переговорные", Component: RoomsTab },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Desktop «Статистика заявок»: один раздел вместо «Статистика / Аналитика / Загрузка». */
export function ManagerStatisticsDesktopView() {
  const state = useManagerStatisticsPage();
  const [tab, setTab] = useState<TabKey>("overview");
  const Active = TABS.find((t) => t.key === tab)!.Component;

  return (
    <PullToRefresh onRefresh={state.handleRefresh}>
      <main className="min-h-screen bg-[#1A1A1A] px-10 pb-16 pt-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Статистика заявок</h1>
            <p className="mt-1 text-sm text-white/60">Сервисные заявки и загрузка переговорных по офисам</p>
          </div>
          <StatisticsToolbar {...state} />
        </div>

        <p className="mt-6 text-[13px] text-white/50">
          Показано: <span className="font-semibold text-white/85">{state.officeName} · {state.rangeLabel}</span> — фильтр действует на все вкладки
        </p>
        {state.exportError && <p role="alert" className="mt-2 text-sm text-red-400">{state.exportError}</p>}

        <div role="tablist" aria-label="Разделы статистики" className="mt-5 inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[10px] border border-white/10 bg-[#2c2c2e] p-[5px]">
          {TABS.map((t) => (
            <Fragment key={t.key}>
              {t.key === "rooms" && <span aria-hidden className="mx-1.5 h-5 w-px shrink-0 bg-white/15" />}
              <button
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "h-[29px] shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  tab === t.key ? "bg-[#E85D2B] text-white" : "text-white/70 hover:text-white",
                )}
              >
                {t.label}
              </button>
            </Fragment>
          ))}
        </div>

        <div className="mt-5">
          <Active {...state} />
        </div>
      </main>
    </PullToRefresh>
  );
}
