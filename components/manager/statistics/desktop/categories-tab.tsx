"use client";

import { Layers, Users } from "lucide-react";
import type { UseManagerStatisticsPageResult } from "@/hooks/use-manager-statistics-page";
import { cn } from "@/lib/utils";
import { ACCENT, EmptyState, ErrorBlock, LoadingBlock, Panel } from "./stats-ui";

function Count({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <td className={cn("py-3.5 pl-4 text-right text-sm tabular-nums", value === 0 ? "text-white/30" : strong ? "font-semibold text-white" : "text-white")}>
      {value}
    </td>
  );
}

function InlineBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 112)) : 0;
  return <span className="inline-block h-1 shrink-0 rounded-full" style={{ width, backgroundColor: ACCENT }} />;
}

const TH = "pb-3 text-left text-[13px] font-normal text-white/50";
const TH_NUM = "pb-3 pl-4 text-right text-[13px] font-normal text-white/50";

export function CategoriesTab(state: UseManagerStatisticsPageResult) {
  const { analytics, reloadAnalytics, officeNameById } = state;
  const detailed = analytics.data?.detailed;

  if (analytics.error && !detailed) return <ErrorBlock error={analytics.error} onRetry={reloadAnalytics} />;
  if (!detailed) return <LoadingBlock />;

  const categories = detailed.byCategory;
  const executors = detailed.byExecutor;
  const maxCategory = Math.max(...categories.map((c) => c.totalRequests), 0);
  const maxExecutor = Math.max(...executors.map((e) => e.totalAssigned), 0);

  return (
    <div className="space-y-5">
      <Panel title="Заявки по категориям">
        {categories.length === 0 ? (
          <EmptyState icon={Layers} title="Нет заявок по категориям" text="За период не создавали заявок с категорией. Попробуйте другой период или офис." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={TH}>Категория</th>
                  <th className={TH}>Офис</th>
                  <th className={TH_NUM}>Всего</th>
                  <th className={TH_NUM}>Новые</th>
                  <th className={TH_NUM}>В работе</th>
                  <th className={TH_NUM}>Завершено</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.categoryId} className="border-b border-white/[0.06] last:border-0">
                    <td className="py-3.5 pr-4">
                      <span className="flex items-center gap-3">
                        <span className="truncate text-sm text-white">{c.categoryName}</span>
                        <InlineBar value={c.totalRequests} max={maxCategory} />
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-sm text-white/50">{c.officeName ?? officeNameById(c.officeId)}</td>
                    <Count value={c.totalRequests} strong />
                    <Count value={c.newRequests} />
                    <Count value={c.inWorkRequests} />
                    <Count value={c.completedRequests} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Исполнители" note="назначено и завершено">
        {executors.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Нет данных по исполнителям"
            text="За период заявки не назначались исполнителям, или данные ещё не посчитаны."
            className="py-14"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={TH}>Исполнитель</th>
                  <th className={TH_NUM}>Назначено</th>
                  <th className={TH_NUM}>В работе</th>
                  <th className={TH_NUM}>Завершено</th>
                </tr>
              </thead>
              <tbody>
                {executors.map((e) => (
                  <tr key={e.executorId} className="border-b border-white/[0.06] last:border-0">
                    <td className="py-3.5 pr-4">
                      <span className="flex items-center gap-3">
                        <span className="truncate text-sm text-white">{e.executorName?.trim() || `Исполнитель ${e.executorId}`}</span>
                        <InlineBar value={e.totalAssigned} max={maxExecutor} />
                      </span>
                    </td>
                    <Count value={e.totalAssigned} strong />
                    <Count value={e.inWorkRequests} />
                    <Count value={e.completedRequests} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
