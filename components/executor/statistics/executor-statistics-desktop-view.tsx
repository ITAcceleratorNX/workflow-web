"use client";

import Link from "next/link";
import { CheckCircle, ChevronLeft } from "lucide-react";
import { ExecutorDesktopShell } from "@/components/layout/ExecutorDesktopShell";
import PerformerCard from "@/components/rating";
import type { UseExecutorStatisticsPageResult } from "@/hooks/use-executor-statistics-page";

type ExecutorStatisticsDesktopViewProps = Pick<
  UseExecutorStatisticsPageResult,
  "stats" | "myRating"
>;

/** Desktop executor statistics — сохраняет текущий web UI. */
export function ExecutorStatisticsDesktopView({
  stats,
  myRating,
}: ExecutorStatisticsDesktopViewProps) {
  return (
    <ExecutorDesktopShell>
      <div className="client-desktop-content client-desktop-dark p-6 lg:p-8 max-w-4xl mx-auto">
        <Link
          href="/executor"
          className="inline-flex items-center gap-1 text-[#E85D2B] font-medium mb-6 hover:text-white/90"
        >
          <ChevronLeft className="h-5 w-5" />
          На главную
        </Link>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl p-6 bg-[#2C2C2E] border border-white/10">
              <h3 className="text-lg font-bold text-white">Моя статистика</h3>
              <p className="text-sm text-white/70 mb-4">Показатели за весь период</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-white">
                  <span>Всего выполнено задач</span>
                  <span className="font-bold">{stats?.totalRequests ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span>Выполнено в срок</span>
                  <span className="font-bold">{stats?.onTime ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span>Просрочено</span>
                  <span className="font-bold">{stats?.overdue ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span>Средняя оценка</span>
                  <span className="font-bold">{myRating ?? 0}/5</span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span>Среднее время выполнения</span>
                  <span className="font-bold">{stats?.averageExecutionHours ?? 0} ч</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6 bg-[#2C2C2E] border border-white/10">
              <h3 className="text-lg font-bold text-white">Рейтинг и достижения</h3>
              <p className="text-sm text-white/70 mb-4">Ваш текущий статус</p>
              <div className="[&_.text-gray-900]:text-white [&_.text-gray-600]:text-white/80">
                <PerformerCard myRating={myRating ?? 0} />
              </div>
              <div className="space-y-3 mt-4">
                {["Быстрое выполнение", "Качественная работа", "Надежный партнер"].map(
                  (label) => (
                    <div
                      key={label}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/10"
                    >
                      <span className="text-sm text-white">{label}</span>
                      <CheckCircle className="w-5 h-5 text-[#E85D2B]" />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ExecutorDesktopShell>
  );
}
