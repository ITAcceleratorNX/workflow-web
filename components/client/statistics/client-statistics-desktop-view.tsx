"use client";

import PullToRefresh from "@/components/pull-to-refresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientAnalyticsStats } from "@/hooks/use-client-statistics-page";

interface ClientStatisticsDesktopViewProps {
  stats: ClientAnalyticsStats | null;
  onRefresh: () => Promise<void>;
}

/** Desktop client analytics — сохраняет текущий web UI. */
export function ClientStatisticsDesktopView({ stats, onRefresh }: ClientStatisticsDesktopViewProps) {
  return (
    <PullToRefresh onRefresh={onRefresh}>
      <div className="min-h-screen pb-20 bg-[#1A1A1A]">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8 client-desktop-content">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Статистика по заявкам</CardTitle>
                <CardDescription>Ваша активность</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Всего подано заявок</span>
                    <span className="font-bold">{stats?.totalRequests ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Завершено успешно</span>
                    <span className="font-bold text-[#114A65]">{stats?.doneRequests ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Средняя оценка от исполнителей</span>
                    <span className="font-bold">{stats?.averageRating ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Количество полученных оценок</span>
                    <span className="font-bold text-[#114A65]">{stats?.totalRatings ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
