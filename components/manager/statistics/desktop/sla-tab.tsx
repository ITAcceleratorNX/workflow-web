"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Layers, Timer, X } from "lucide-react";
import { eachDayKey, parseDateKey } from "@/lib/manager-period";
import type { ManagerSlaCategory } from "@/lib/manager-stats-api";
import type { UseManagerStatisticsPageResult } from "@/hooks/use-manager-statistics-page";
import { BarChart } from "./bar-chart";
import { sparseDayLabel } from "./overview-tab";
import {
  BarRow,
  CATEGORY_COLORS,
  EmptyPanel,
  ErrorBlock,
  formatHours,
  KpiCard,
  LoadingBlock,
  Panel,
  plural,
} from "./stats-ui";

const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const MONTHS_FULL = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

interface Bucket {
  key: string;
  avgHours: number;
  totalCompleted: number;
  categories: Array<{ categoryName: string; avgHours: number; totalCompleted: number }>;
}

function mergeCategories(rows: ManagerSlaCategory[][]) {
  const map = new Map<string, { sum: number; count: number }>();
  for (const list of rows) {
    for (const c of list) {
      const entry = map.get(c.categoryName) ?? { sum: 0, count: 0 };
      entry.sum += Number(c.avgHours) * c.totalCompleted;
      entry.count += c.totalCompleted;
      map.set(c.categoryName, entry);
    }
  }
  return [...map].map(([categoryName, { sum, count }]) => ({ categoryName, avgHours: count ? sum / count : 0, totalCompleted: count }));
}

function tooltipTitle(key: string, byMonth: boolean) {
  if (byMonth) {
    const [y, m] = key.split("-").map(Number);
    return `${MONTHS_FULL[m - 1][0].toUpperCase()}${MONTHS_FULL[m - 1].slice(1)} ${y}`;
  }
  const text = parseDateKey(key).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  return text[0].toUpperCase() + text.slice(1);
}

export function SlaTab(state: UseManagerStatisticsPageResult) {
  const { analytics, reloadAnalytics, range, groupByMonth } = state;
  const sla = analytics.data?.sla;
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => setSelected(null), [range, state.office]);

  const buckets: Bucket[] = useMemo(() => {
    if (!sla) return [];
    const byDay = new Map(sla.byDate.map((d) => [d.date, d]));
    const days = eachDayKey(range.fromKey, range.toKey);
    if (!groupByMonth) {
      return days.map((key) => {
        const d = byDay.get(key);
        return {
          key,
          avgHours: d ? Number(d.avgHours) : 0,
          totalCompleted: d?.totalCompleted ?? 0,
          categories: d ? mergeCategories([d.byCategory]) : [],
        };
      });
    }
    const months = new Map<string, typeof sla.byDate>();
    for (const key of days) {
      const month = key.slice(0, 7);
      const list = months.get(month) ?? [];
      const d = byDay.get(key);
      if (d) list.push(d);
      months.set(month, list);
    }
    return [...months].map(([key, list]) => {
      const count = list.reduce((s, d) => s + d.totalCompleted, 0);
      const sum = list.reduce((s, d) => s + Number(d.avgHours) * d.totalCompleted, 0);
      return { key, avgHours: count ? sum / count : 0, totalCompleted: count, categories: mergeCategories(list.map((d) => d.byCategory)) };
    });
  }, [sla, range, groupByMonth]);

  if (analytics.error && !sla) return <ErrorBlock error={analytics.error} onRetry={reloadAnalytics} />;

  const completed = sla?.totalCompleted ?? 0;
  const categoryColor = new Map((sla?.byCategory ?? []).map((c, i) => [c.categoryName, CATEGORY_COLORS[i % CATEGORY_COLORS.length]]));
  const kpis = (
    <div className="grid gap-3 md:grid-cols-3">
      <KpiCard tone="green" icon={CheckCircle2} label="Завершено заявок" value={sla ? completed : "—"} />
      <KpiCard tone="neutral" icon={Timer} label="Среднее время выполнения" value={formatHours(sla?.avgHours)} />
      <KpiCard tone="neutral" icon={Layers} label="Категорий с данными" value={sla ? sla.byCategory.length : "—"} />
    </div>
  );

  if (!sla) return <div className="space-y-5">{kpis}<LoadingBlock /></div>;

  if (completed === 0) {
    return (
      <div className="space-y-5">
        {kpis}
        <EmptyPanel
          icon={Clock}
          title="Пока нечего считать"
          text="Сроки появятся, когда за выбранный период будут завершённые заявки с отметкой времени выполнения. Попробуйте период «Год» или другой офис."
        />
      </div>
    );
  }

  const keys = buckets.map((b) => b.key);
  const maxCategoryHours = Math.max(...sla.byCategory.map((c) => Number(c.avgHours)), 0);

  return (
    <div className="space-y-5">
      {kpis}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(320px,4fr)]">
        <Panel title={groupByMonth ? "По месяцам" : "По дням"} note="среднее время, ч">
          <BarChart
            data={buckets.map((b) => ({
              key: b.key,
              value: b.avgHours,
              topLabel: b.totalCompleted > 0 ? Math.round(b.avgHours) : null,
              ariaLabel: `${tooltipTitle(b.key, groupByMonth)}: ${formatHours(b.avgHours)}`,
            }))}
            xLabel={groupByMonth ? (i) => MONTHS_SHORT[Number(keys[i].slice(5, 7)) - 1] : sparseDayLabel(keys)}
            selectedIndex={selected}
            onSelect={setSelected}
            dimColor={selected == null ? undefined : "#6b3420"}
            renderTooltip={(index) => {
              const b = buckets[index];
              return (
                <div role="dialog" aria-label={tooltipTitle(b.key, groupByMonth)} className="w-[248px] rounded-xl border border-white/10 bg-[#2c2c2e] p-3 shadow-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{tooltipTitle(b.key, groupByMonth)}</p>
                    <button type="button" aria-label="Закрыть подсказку" onClick={() => setSelected(null)} className="text-white/60 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-white/50">
                    В среднем {formatHours(b.avgHours)} · завершено {b.totalCompleted} {plural(b.totalCompleted, "заявка", "заявки", "заявок")}
                  </p>
                  <ul className="mt-2.5 space-y-1.5">
                    {b.categories.map((c) => (
                      <li key={c.categoryName} className="flex items-center gap-2 text-[13px]">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor.get(c.categoryName) ?? "#8e8e93" }} />
                        <span className="min-w-0 flex-1 truncate text-white">{c.categoryName}</span>
                        <span className="font-semibold text-white tabular-nums">{formatHours(c.avgHours)}</span>
                        <span className="w-10 text-right text-white/40 tabular-nums">{c.totalCompleted} шт.</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }}
          />
        </Panel>
        <Panel title="По категориям" note="среднее время, ч">
          <div className="space-y-4">
            {sla.byCategory.map((c) => (
              <BarRow key={c.categoryName} label={c.categoryName} value={Number(c.avgHours)} max={maxCategoryHours} display={formatHours(c.avgHours)} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
