"use client";

import { Loader2, Lock } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ui/screen-header";
import { MOBILE_BOTTOM_NAV_PADDING } from "@/constants/mobile-layout";
import {
  ProgressDonut,
  StatBar,
} from "@/components/client/statistics/task-stats-visualization";
import {
  taskCompletionRatio,
  type UseTaskCompletionStatsResult,
} from "@/hooks/use-task-completion-stats";

const ACCENT_BLUE = "#3B82F6";
const ACCENT_AMBER = "#F59E0B";
const PRIMARY = "#F35713";
const TRACK = "rgba(255,255,255,0.12)";

interface ClientStatisticsMobileViewProps {
  taskStats: UseTaskCompletionStatsResult;
  onRefresh: () => Promise<void>;
  hasToken: boolean;
}

/** Mobile client statistics — parity с workflow-mobile app/client/tasks/stats.tsx. */
export function ClientStatisticsMobileView({
  taskStats,
  onRefresh,
  hasToken,
}: ClientStatisticsMobileViewProps) {
  const {
    todayCompleted,
    todayTotal,
    weekCompleted,
    weekTotal,
    monthCompleted,
    monthTotal,
    loading,
  } = taskStats;

  return (
    <>
      <PullToRefresh onRefresh={onRefresh}>
        <div
          className="min-h-screen bg-background flex flex-col"
          style={{ paddingBottom: MOBILE_BOTTOM_NAV_PADDING }}
        >
          <ScreenHeader title="Статистика задач" />

          <div className="flex-1 px-4 pt-1 pb-6 overflow-y-auto">
            {!hasToken ? (
              <div className="flex flex-col items-center gap-2.5 py-10 px-6 rounded-[14px] border border-border bg-card">
                <Lock className="h-10 w-10 text-muted-foreground" />
                <p className="text-lg font-bold text-foreground mt-2">Войдите в аккаунт</p>
                <p className="text-sm text-muted-foreground text-center">
                  Статистика доступна после входа
                </p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#F35713]" />
                <p className="text-sm text-muted-foreground">Загружаем данные…</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Обзор
                </p>
                <div className="flex gap-5 overflow-x-auto pb-2 -mx-1 px-1">
                  <ProgressDonut
                    size={92}
                    strokeWidth={9}
                    progress={taskCompletionRatio(todayCompleted, todayTotal)}
                    color={PRIMARY}
                    trackColor={TRACK}
                    label="Сегодня"
                    subtitle={`${todayCompleted} из ${todayTotal}`}
                  />
                  <ProgressDonut
                    size={92}
                    strokeWidth={9}
                    progress={taskCompletionRatio(weekCompleted, weekTotal)}
                    color={ACCENT_BLUE}
                    trackColor={TRACK}
                    label="Неделя"
                    subtitle={`${weekCompleted} из ${weekTotal}`}
                  />
                  <ProgressDonut
                    size={92}
                    strokeWidth={9}
                    progress={taskCompletionRatio(monthCompleted, monthTotal)}
                    color={ACCENT_AMBER}
                    trackColor={TRACK}
                    label="Месяц"
                    subtitle={`${monthCompleted} из ${monthTotal}`}
                  />
                </div>

                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-3">
                  График
                </p>
                <div className="rounded-[14px] border border-border bg-card p-4 pb-3">
                  <StatBar
                    label="Сегодня"
                    completed={todayCompleted}
                    total={todayTotal}
                    color={PRIMARY}
                    trackColor={TRACK}
                  />
                  <StatBar
                    label="Неделя"
                    completed={weekCompleted}
                    total={weekTotal}
                    color={ACCENT_BLUE}
                    trackColor={TRACK}
                  />
                  <StatBar
                    label="Месяц"
                    completed={monthCompleted}
                    total={monthTotal}
                    color={ACCENT_AMBER}
                    trackColor={TRACK}
                  />

                  <div className="flex flex-wrap gap-3.5 mt-2 pt-3.5 border-t border-border">
                    {[
                      { color: PRIMARY, label: "Сегодня" },
                      { color: ACCENT_BLUE, label: "Неделя" },
                      { color: ACCENT_AMBER, label: "Месяц" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-semibold text-muted-foreground">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </PullToRefresh>

      <BottomNav activeTab="statistics" />
    </>
  );
}
