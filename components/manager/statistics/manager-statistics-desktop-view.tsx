"use client";

import dynamic from "next/dynamic";
import PullToRefresh from "@/components/pull-to-refresh";
import { MeetingRoomStatistics } from "@/components/meeting-rooms/MeetingRoomStatistics";
import { Tabs, TabsContent, TabsList, TabsListScrollArea, TabsTrigger } from "@/components/ui/tabs";
import { useManagerStatisticsPage } from "@/hooks/use-manager-statistics-page";
import { ManagerStatisticsStatsPanels } from "./manager-statistics-stats-panels";

const ManagerAnalytics = dynamic(() => import("@/components/ManagerAnalytics"), { ssr: false });

/** Desktop manager statistics — сохраняет текущий web UI + ManagerAnalytics. */
export function ManagerStatisticsDesktopView() {
  const state = useManagerStatisticsPage();

  return (
    <PullToRefresh onRefresh={state.handleRefresh}>
      <main className="min-h-screen pb-20 bg-[#1A1A1A]">
        <Tabs defaultValue="stats" className="w-full px-4 pt-4">
          <TabsListScrollArea className="mb-4">
            <TabsList className="flex flex-nowrap flex-shrink-0 justify-start gap-1 rounded-xl bg-[#2C2C2E]/80 border border-white/10 p-1.5 h-auto min-h-0 min-w-0">
              <TabsTrigger
                value="stats"
                className="flex-shrink-0 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/60 data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white/90"
              >
                Статистика
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex-shrink-0 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/60 data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white/90"
              >
                Аналитика
              </TabsTrigger>
              <TabsTrigger
                value="workload"
                className="flex-shrink-0 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/60 data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white/90"
              >
                Загрузка
              </TabsTrigger>
            </TabsList>
          </TabsListScrollArea>
          <TabsContent value="stats" className="mt-0">
            <ManagerStatisticsStatsPanels {...state} isDesktop />
          </TabsContent>
          <TabsContent value="analytics" className="mt-0">
            <ManagerAnalytics />
          </TabsContent>
          <TabsContent value="workload" className="mt-0">
            <MeetingRoomStatistics variant="dark" defaultShowCalendar />
          </TabsContent>
        </Tabs>
      </main>
    </PullToRefresh>
  );
}
