"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Users,
} from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatRow } from "@/components/ui/stat-row";
import type { AdminWorkerStats } from "@/lib/admin-worker-stats-api";

interface AdminWorkerStatisticsMobileViewProps {
  stats: AdminWorkerStats | null;
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
      <p className="text-[22px] font-bold text-white mt-1.5">{value}</p>
      <p className="text-xs text-[#8E8E93] mt-0.5">{label}</p>
    </div>
  );
}

/** Mobile admin-worker statistics — parity с workflow-mobile app/admin-worker/statistics.tsx. */
export function AdminWorkerStatisticsMobileView({
  stats,
  loading,
  error,
  onRefresh,
  onRetry,
}: AdminWorkerStatisticsMobileViewProps) {
  const sc = stats?.statusCounts;
  const rts = stats?.requestTypeSummary ?? {};

  return (
    <PullToRefresh onRefresh={onRefresh}>
      <div className="min-h-screen bg-background flex flex-col">
        <ScreenHeader title="Статистика" />

        {loading && !stats ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#F35713]" />
            <p className="text-sm text-[#8E8E93]">Загрузка...</p>
          </div>
        ) : error ? (
          <div className="mx-4 my-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Повторить
            </Button>
          </div>
        ) : (
          <div className="px-4 pb-6">
            <div className="flex flex-wrap gap-2.5 mb-4">
              <QuickStatCard
                icon={<Clock className="h-[22px] w-[22px] text-amber-500" />}
                value={sc?.new ?? 0}
                label="Новые"
                className="bg-amber-500/20"
              />
              <QuickStatCard
                icon={<Users className="h-[22px] w-[22px] text-blue-500" />}
                value={sc?.inWork ?? 0}
                label="В работе"
                className="bg-blue-500/20"
              />
              <QuickStatCard
                icon={<CheckCircle className="h-[22px] w-[22px] text-green-600" />}
                value={sc?.completed ?? 0}
                label="Завершено"
                className="bg-green-600/20"
              />
              <QuickStatCard
                icon={<AlertTriangle className="h-[22px] w-[22px] text-red-500" />}
                value={sc?.overdue ?? 0}
                label="Просрочено"
                className="bg-red-500/20"
              />
            </div>

            <div className="rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] p-4 mb-4">
              <h2 className="text-[17px] font-semibold text-white mb-4">Статистика по заявкам</h2>
              <StatRow label="Всего заявок" value={stats?.totalRequests ?? 0} />
              <StatRow
                label="Завершено"
                value={sc?.completed ?? 0}
                valueClassName="text-green-600"
              />
              <StatRow label="В работе" value={sc?.inWork ?? 0} valueClassName="text-blue-500" />
              <StatRow label="Новые" value={sc?.new ?? 0} valueClassName="text-[#F35713]" />
              <StatRow
                label="Просрочено"
                value={sc?.overdue ?? 0}
                valueClassName="text-red-500"
              />
            </div>

            <div className="rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] p-4">
              <h2 className="text-[17px] font-semibold text-white mb-4">По типам заявок</h2>
              <StatRow label="Обычные" value={typeof rts.normal === "number" ? rts.normal : 0} />
              <StatRow label="Экстренные" value={typeof rts.urgent === "number" ? rts.urgent : 0} />
              <StatRow label="Плановые" value={typeof rts.planned === "number" ? rts.planned : 0} />
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
