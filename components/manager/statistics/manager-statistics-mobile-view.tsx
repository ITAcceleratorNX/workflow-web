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
      <p className="text-[22px] font-bold text-foreground mt-1.5">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
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
          ? "bg-primary border-primary text-primary-foreground"
          : "bg-card border-border text-muted-foreground",
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
  analytics,
  analyticsError,
  retryAnalytics,
  exporting,
  exportError,
  error,
  handleRefresh,
  handleExport,
  retry,
}: ManagerStatisticsMobileViewProps) {
  const sc = stats?.statusCounts;
  const rts = stats?.requestTypeSummary ?? {};

  return (
    <div className="min-h-screen bg-background ">
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

      <p className="px-4 mb-4 text-sm text-muted-foreground">Все доступные офисы · За весь доступный период</p>

      {activeTab === "stats" && (
        <PullToRefresh onRefresh={handleRefresh}>
          {error && <div role="alert" className="mx-4 mb-4 rounded-xl border border-destructive/30 p-4 text-foreground">
            <p>{error}</p>
            {stats && <p className="mt-1 text-sm text-muted-foreground">Показаны данные последней успешной загрузки.</p>}
            <Button className="mt-3" variant="outline" disabled={loading} onClick={retry}>Повторить</Button>
          </div>}
          {loading && !stats ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-[#F35713]" />
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            </div>
          ) : stats ? (
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

              <div className="rounded-xl border border-border bg-card p-4 mb-4">
                <h2 className="text-[17px] font-semibold text-foreground mb-4">Статистика по заявкам</h2>
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

              <div className="rounded-xl border border-border bg-card p-4 mb-4">
                <h2 className="text-[17px] font-semibold text-foreground mb-4">По типам заявок</h2>
                <StatRow label="Обычные" value={typeof rts.normal === "number" ? rts.normal : 0} />
                <StatRow label="Экстренные" value={typeof rts.urgent === "number" ? rts.urgent : 0} />
                <StatRow label="Плановые" value={typeof rts.planned === "number" ? rts.planned : 0} />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-[17px] font-semibold text-foreground mb-4">Экспорт данных</h2>
                {exporting && <p role="status" className="mb-3 text-sm text-muted-foreground">Подготовка файла…</p>}
                {exportError && <p role="alert" className="mb-3 text-sm text-destructive">{exportError}</p>}
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="flex-1"
                    disabled={exporting}
                    onClick={() => handleExport("xlsx")}
                  >
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-border text-foreground"
                    disabled={exporting}
                    onClick={() => handleExport("pbix")}
                  >
                    Шаблон Power BI
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </PullToRefresh>
      )}

      {activeTab === "analytics" && (
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="px-4 pb-6 space-y-4">
            {analyticsError && <div role="alert" className="rounded-xl border border-destructive/30 p-4 text-foreground">
              <p>{analyticsError}</p>
              {analytics && <p className="mt-1 text-sm text-muted-foreground">Показаны данные последней успешной загрузки.</p>}
              <Button className="mt-3" variant="outline" disabled={analyticsLoading} onClick={retryAnalytics}>Повторить</Button>
            </div>}
            {analyticsLoading && <p role="status" className="py-6 text-center text-muted-foreground">Загрузка аналитики…</p>}
            {analytics && <>
              <section className="rounded-xl border border-border bg-card p-4 text-card-foreground">
                <h2 className="text-lg font-semibold">Время выполнения по офисам</h2>
                <p className="mt-1 text-sm text-muted-foreground">Среднее время закрытия завершённых заявок, часы.</p>
                {analytics.sla.length === 0 && <p className="mt-4 text-muted-foreground">Завершённых заявок с данными о времени пока нет.</p>}
                {analytics.sla.map((row) => <div key={row.officeId} className="mt-4 border-t border-border pt-3">
                  <h3 className="font-medium break-words">{analytics.offices.find((office) => office.id === row.officeId)?.name ?? `Офис №${row.officeId}`}</h3>
                  <p className="mt-1">{Number.isFinite(Number(row.avgHours)) ? Number(row.avgHours).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) : "—"} ч · Завершено: {row.totalCompleted}</p>
                </div>)}
              </section>
              <section className="rounded-xl border border-border bg-card p-4 text-card-foreground">
                <h2 className="text-lg font-semibold">Оценки по офисам</h2>
                {analytics.ratings.length === 0 && <p className="mt-4 text-muted-foreground">Оценок пока нет.</p>}
                {analytics.ratings.map((row) => <div key={row.officeId} className="mt-4 border-t border-border pt-3">
                  <h3 className="font-medium break-words">{analytics.offices.find((office) => office.id === row.officeId)?.name ?? `Офис №${row.officeId}`}</h3>
                  <p className="mt-1">{Number.isFinite(Number(row.avgRating)) ? Number(row.avgRating).toLocaleString("ru-RU", { maximumFractionDigits: 2 }) : "—"} из 5 · Оценок: {row.totalRatings}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Оценок 1–2: {row.lowRatings}</p>
                </div>)}
              </section>
            </>}
          </div>
        </PullToRefresh>
      )}
    </div>
  );
}
