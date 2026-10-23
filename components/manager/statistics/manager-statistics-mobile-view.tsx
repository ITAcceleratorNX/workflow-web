"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle, ChevronLeft, Clock, Loader2, Star, Timer, Users } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UseManagerStatisticsMobilePageResult } from "@/hooks/use-manager-statistics-mobile-page";

type ManagerStatisticsMobileViewProps = UseManagerStatisticsMobilePageResult;

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-[46px] flex-1 rounded-[14px] border px-4 text-[16px] font-semibold transition-colors",
        active ? "border-[#E8622E] bg-[#E8622E] text-white" : "border-white/10 bg-[#121212] text-white/70",
      )}
    >
      {label}
    </button>
  );
}

function StatusTile({ icon, value, label, className }: { icon: ReactNode; value: number; label: string; className: string }) {
  return (
    <div className={cn("flex min-h-[118px] flex-col rounded-[20px] p-4", className)}>
      {icon}
      <span className="mt-2 text-[30px] font-bold leading-tight text-white tabular-nums">{value}</span>
      <span className="text-[15px] text-white/60">{label}</span>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] bg-[#2A2A2C] p-5">
      <h2 className="text-[19px] font-semibold text-white">{title}</h2>
      {subtitle && <p className="mt-2 text-[13px] text-white/50">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(value > 0 ? 3 : 0, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-[#E8622E]" style={{ width: `${width}%` }} />
    </div>
  );
}

function EmptyNote({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.06] p-4 text-[15px] text-white/80">
      <span className="shrink-0 text-white/60">{icon}</span>
      {text}
    </div>
  );
}

const hours = (value: number | string | null | undefined) => {
  const n = Number(value);
  return value == null || !Number.isFinite(n) ? "—" : `${n.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} ч`;
};

const ratingWord = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "оценка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "оценки";
  return "оценок";
};

/** Mobile статистика Руководителя: «Заявки» и «Сроки и оценки» (все офисы, всё время). */
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
  const types = [
    { label: "Обычные", value: Number(rts.normal) || 0 },
    { label: "Экстренные", value: Number(rts.urgent) || 0 },
    { label: "Плановые", value: Number(rts.planned) || 0 },
  ];
  const typesMax = Math.max(stats?.totalRequests ?? 0, 1);

  const sla = analytics?.sla;
  const ratingSummary = analytics?.ratings.summary;
  const officeName = (id: number) => analytics?.offices.find((o) => o.id === id)?.name ?? `Офис №${id}`;
  const slaOffices = [...(sla?.byOffice ?? [])].sort((a, b) => Number(b.avgHours) - Number(a.avgHours));
  const slaMax = Math.max(...slaOffices.map((o) => Number(o.avgHours)), 0);
  const avgRating = Number(ratingSummary?.avgRating ?? 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-4">
        <Link href="/manager/cabinet" className="inline-flex items-center gap-1 text-[17px] font-medium text-[#E8622E]">
          <ChevronLeft className="h-5 w-5" />
          Назад
        </Link>
        <h1 className="mt-3 text-[28px] font-bold text-white">Статистика</h1>
      </div>

      <div className="mt-3 flex gap-2.5 px-4">
        <TabButton active={activeTab === "stats"} label="Заявки" onClick={() => setActiveTab("stats")} />
        <TabButton active={activeTab === "analytics"} label="Сроки и оценки" onClick={() => setActiveTab("analytics")} />
      </div>

      <p className="mb-3 mt-3 px-4 text-[13px] text-white/50">Все офисы · за всё время</p>

      {activeTab === "stats" && (
        <PullToRefresh onRefresh={handleRefresh}>
          {error && (
            <div role="alert" className="mx-4 mb-4 rounded-xl border border-destructive/30 p-4 text-foreground">
              <p>{error}</p>
              {stats && <p className="mt-1 text-sm text-muted-foreground">Показаны данные последней успешной загрузки.</p>}
              <Button className="mt-3" variant="outline" disabled={loading} onClick={retry}>Повторить</Button>
            </div>
          )}
          {loading && !stats ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-[#F35713]" />
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            </div>
          ) : stats ? (
            <div className="space-y-3 px-4 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <StatusTile icon={<Clock className="h-6 w-6 text-[#F5C518]" />} value={sc?.new ?? 0} label="Новые" className="bg-[#33290B]" />
                <StatusTile icon={<Users className="h-6 w-6 fill-[#4A90E2] text-[#4A90E2]" />} value={sc?.inWork ?? 0} label="В работе" className="bg-[#0F1C33]" />
                <StatusTile icon={<CheckCircle className="h-6 w-6 fill-[#22C55E] text-[#0F2A14]" />} value={sc?.completed ?? 0} label="Завершено" className="bg-[#0F2A14]" />
                <StatusTile icon={<AlertTriangle className="h-6 w-6 fill-[#EF5350] text-[#2E1414]" />} value={sc?.overdue ?? 0} label="Просрочено" className="bg-[#2E1414]" />
              </div>

              <Card title="По типам заявок">
                <div className="flex items-center justify-between py-1.5 text-[15px]">
                  <span className="text-white/60">Всего заявок</span>
                  <span className="font-semibold text-white tabular-nums">{stats.totalRequests}</span>
                </div>
                {types.map((type) => (
                  <div key={type.label} className="py-1.5">
                    <div className="mb-1.5 flex items-center justify-between text-[15px]">
                      <span className="text-white/60">{type.label}</span>
                      <span className="font-semibold text-white tabular-nums">{type.value}</span>
                    </div>
                    <Bar value={type.value} max={typesMax} />
                  </div>
                ))}
              </Card>

              <Card title="Экспорт данных">
                {exporting && <p role="status" className="mb-3 text-sm text-white/60">Подготовка файла…</p>}
                {exportError && <p role="alert" className="mb-3 text-sm text-destructive">{exportError}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={() => handleExport("xlsx")}
                    className="h-[50px] flex-1 rounded-[14px] bg-[#E8622E] text-[16px] font-semibold text-white disabled:opacity-60"
                  >
                    Excel
                  </button>
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={() => handleExport("pbix")}
                    className="h-[50px] flex-1 rounded-[14px] bg-[#121212] text-[16px] font-semibold text-white/80 disabled:opacity-60"
                  >
                    Power BI
                  </button>
                </div>
              </Card>
            </div>
          ) : null}
        </PullToRefresh>
      )}

      {activeTab === "analytics" && (
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-3 px-4 pb-6">
            {analyticsError && (
              <div role="alert" className="rounded-xl border border-destructive/30 p-4 text-foreground">
                <p>{analyticsError}</p>
                {analytics && <p className="mt-1 text-sm text-muted-foreground">Показаны данные последней успешной загрузки.</p>}
                <Button className="mt-3" variant="outline" disabled={analyticsLoading} onClick={retryAnalytics}>Повторить</Button>
              </div>
            )}
            {analyticsLoading && !analytics && <p role="status" className="py-6 text-center text-muted-foreground">Загрузка…</p>}
            {analytics && (
              <>
                <Card title="Сроки выполнения" subtitle="Среднее время закрытия завершённых заявок">
                  {sla && sla.totalCompleted > 0 ? (
                    <>
                      <p className="flex items-baseline gap-2">
                        <span className="text-[30px] font-bold text-white">{hours(sla.avgHours)}</span>
                        <span className="text-[15px] text-white/50">в среднем</span>
                      </p>
                      <div className="mt-3 space-y-3">
                        {slaOffices.map((row) => (
                          <div key={row.officeId}>
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-[15px]">
                              <span className="min-w-0 truncate text-white/60">{officeName(row.officeId)}</span>
                              <span className="shrink-0 font-semibold text-white">{hours(row.avgHours)}</span>
                            </div>
                            <Bar value={Number(row.avgHours)} max={slaMax} />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptyNote icon={<Timer className="h-6 w-6" />} text="Завершённых заявок с данными о времени пока нет." />
                  )}
                </Card>

                <Card title="Оценки" subtitle="Средняя оценка выполненных заявок">
                  {ratingSummary && ratingSummary.totalRatings > 0 ? (
                    <>
                      <p className="flex items-center gap-3">
                        <span className="text-[30px] font-bold text-white">
                          {avgRating.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </span>
                        <span className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className={cn("h-5 w-5", avgRating >= i - 0.25 ? "fill-[#F5A623] text-[#F5A623]" : "fill-white/10 text-white/10")} />
                          ))}
                        </span>
                      </p>
                      <p className="mt-3 text-[15px] text-white/50">
                        {ratingSummary.totalRatings} {ratingWord(ratingSummary.totalRatings)} ·{" "}
                        {ratingSummary.lowRatings > 0 ? `низких: ${ratingSummary.lowRatings}` : "низких нет"}
                      </p>
                    </>
                  ) : (
                    <EmptyNote icon={<Star className="h-6 w-6 fill-current" />} text="Оценок пока нет. Клиенты ставят оценку после завершения заявки." />
                  )}
                </Card>
              </>
            )}
          </div>
        </PullToRefresh>
      )}
    </div>
  );
}
