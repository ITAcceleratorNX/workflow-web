"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle, Clock, Loader2, Users } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatRow } from "@/components/ui/stat-row";
import { MOBILE_BOTTOM_NAV_PADDING } from "@/constants/mobile-layout";
import type { ExecutorStats } from "@/lib/executor-stats-api";

interface ExecutorStatisticsMobileViewProps {
  stats: ExecutorStats | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onRetry: () => void;
}

function QuickStatCard({
  icon,
  value,
  label,
  className,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  className: string;
}) {
  return (
    <div className={`flex-1 min-w-[47%] max-w-[48%] rounded-xl p-3.5 ${className}`}>
      {icon}
      <p className="text-[22px] font-bold text-foreground mt-1.5">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

/** Mobile executor statistics — parity с workflow-mobile app/executor/statistics.tsx. */
export function ExecutorStatisticsMobileView({
  stats,
  loading,
  error,
  onRefresh,
  onRetry,
}: ExecutorStatisticsMobileViewProps) {
  const content = (
    <>
      <ScreenHeader title="Статистика" />

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#F35713]" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      ) : error ? (
        <div className="mx-4 my-4 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Повторить
          </Button>
        </div>
      ) : (
        <div className="px-4 pb-6" style={{ paddingBottom: MOBILE_BOTTOM_NAV_PADDING }}>
          <div className="flex flex-wrap gap-2.5 mb-4">
            <QuickStatCard
              icon={<Users className="h-[22px] w-[22px] text-blue-500" />}
              value={stats?.inWork ?? 0}
              label="В работе"
              className="bg-blue-500/20"
            />
            <QuickStatCard
              icon={<CheckCircle className="h-[22px] w-[22px] text-green-600" />}
              value={stats?.completed ?? 0}
              label="Завершено"
              className="bg-green-600/20"
            />
            <QuickStatCard
              icon={<Clock className="h-[22px] w-[22px] text-green-500" />}
              value={stats?.onTime ?? 0}
              label="В срок"
              className="bg-green-500/20"
            />
            <QuickStatCard
              icon={<AlertTriangle className="h-[22px] w-[22px] text-red-500" />}
              value={stats?.overdue ?? 0}
              label="Просрочено"
              className="bg-red-500/20"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-4 mb-4">
            <h2 className="text-[17px] font-semibold text-foreground mb-4">Мои показатели</h2>
            <StatRow label="Всего заявок" value={stats?.totalRequests ?? 0} />
            <StatRow
              label="Завершено"
              value={stats?.completed ?? 0}
              valueClassName="text-green-600"
            />
            <StatRow label="В работе" value={stats?.inWork ?? 0} valueClassName="text-blue-500" />
            <StatRow label="В срок" value={stats?.onTime ?? 0} valueClassName="text-green-600" />
            <StatRow
              label="Просрочено"
              value={stats?.overdue ?? 0}
              valueClassName="text-red-500"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-[17px] font-semibold text-foreground mb-4">Рейтинг и время</h2>
            <StatRow label="Средний рейтинг" value={stats?.averageRating ?? "0.00"} />
            <StatRow
              label="Среднее время выполнения (ч)"
              value={stats?.averageExecutionHours ?? "0.00"}
            />
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <PullToRefresh onRefresh={onRefresh}>
        <div className="min-h-screen bg-background flex flex-col">{content}</div>
      </PullToRefresh>
      <BottomNav activeTab="statistics" />
    </>
  );
}
