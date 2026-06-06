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
import { cn } from "@/lib/utils";
import type { UseManagerStatisticsMobilePageResult } from "@/hooks/use-manager-statistics-mobile-page";

type ManagerStatisticsMobileViewProps = UseManagerStatisticsMobilePageResult;

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

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 py-2.5 px-4 rounded-[10px] text-[15px] font-medium border transition-colors",
        active
          ? "bg-[#F35713] border-[#F35713] text-white"
          : "bg-[#2C2C2E] border-[#3A3A3C] text-[#8E8E93]",
      )}
    >
      {label}
    </button>
  );
}

/** Mobile manager statistics — parity с workflow-mobile app/manager/statistics.tsx. */
export function ManagerStatisticsMobileView({
  activeTab,
  setActiveTab,
  stats,
  loading,
  analyticsLoading,
  error,
  handleRefresh,
  handleExport,
  retry,
}: ManagerStatisticsMobileViewProps) {
  const sc = stats?.statusCounts;
  const rts = stats?.requestTypeSummary ?? {};

  return (
    <div className="min-h-screen bg-[#1C1C1E] pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
      <ScreenHeader title="Аналитика" />

      <div className="flex gap-2 px-4 mb-3">
        <TabButton
          active={activeTab === "stats"}
          label="Статистика"
          onClick={() => setActiveTab("stats")}
        />
        <TabButton
          active={activeTab === "analytics"}
          label="Аналитика"
          onClick={() => setActiveTab("analytics")}
        />
      </div>

      {activeTab === "stats" && (
        <PullToRefresh onRefresh={handleRefresh}>
          {loading && !stats ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-[#F35713]" />
              <p className="text-sm text-[#8E8E93]">Загрузка...</p>
            </div>
          ) : error ? (
            <div className="mx-4 my-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={retry}>
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

              <div className="rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] p-4 mb-4">
                <h2 className="text-[17px] font-semibold text-white mb-4">По типам заявок</h2>
                <StatRow label="Обычные" value={typeof rts.normal === "number" ? rts.normal : 0} />
                <StatRow label="Экстренные" value={typeof rts.urgent === "number" ? rts.urgent : 0} />
                <StatRow label="Плановые" value={typeof rts.planned === "number" ? rts.planned : 0} />
              </div>

              <div className="rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] p-4">
                <h2 className="text-[17px] font-semibold text-white mb-4">Экспорт данных</h2>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-[#F35713] hover:bg-[#F35713]/90"
                    onClick={() => handleExport("xlsx")}
                  >
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-[#3A3A3C] text-white"
                    onClick={() => handleExport("pbix")}
                  >
                    Power BI
                  </Button>
                </div>
              </div>
            </div>
          )}
        </PullToRefresh>
      )}

      {activeTab === "analytics" && (
        <PullToRefresh onRefresh={handleRefresh}>
          {analyticsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-[#F35713]" />
              <p className="text-sm text-[#8E8E93]">Загрузка...</p>
            </div>
          ) : (
            <div className="px-4 pb-6 space-y-4">
              <div className="rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] p-4">
                <h2 className="text-[17px] font-semibold text-white mb-2">
                  SLA и время выполнения
                </h2>
                <p className="text-sm text-[#8E8E93] leading-5">
                  Данные по срокам и среднему времени закрытия заявок (как в браузере).
                </p>
              </div>
              <div className="rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] p-4">
                <h2 className="text-[17px] font-semibold text-white mb-2">Рейтинги</h2>
                <p className="text-sm text-[#8E8E93] leading-5">
                  Средние оценки по офисам, категориям, исполнителям (как в браузере).
                </p>
              </div>
            </div>
          )}
        </PullToRefresh>
      )}
    </div>
  );
}
