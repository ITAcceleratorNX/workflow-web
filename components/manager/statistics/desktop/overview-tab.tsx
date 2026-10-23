"use client";

import { AlertTriangle, CheckCircle2, CircleDot, Clock, Inbox, Users } from "lucide-react";
import { parseDateKey } from "@/lib/manager-period";
import type { UseManagerStatisticsPageResult } from "@/hooks/use-manager-statistics-page";
import { BarChart } from "./bar-chart";
import { EmptyPanel, KpiCard, LoadingBlock, Panel, ProgressBar } from "./stats-ui";

const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** Подписи оси X: первый день, каждый седьмой и последний (не впритык к соседней). */
export function sparseDayLabel(keys: string[]) {
  const last = keys.length - 1;
  return (index: number) => {
    const show = index === 0 || index === last || ((index + 1) % 7 === 0 && last - index >= 3);
    return show ? String(parseDateKey(keys[index]).getDate()) : null;
  };
}

function monthSpan(fromKey: string, toKey: string) {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  const a = MONTHS[from.getMonth()];
  const b = MONTHS[to.getMonth()];
  return a === b && from.getFullYear() === to.getFullYear() ? a : `${a} – ${b}`;
}

function formatPerDay(value: number) {
  return value.toLocaleString("ru-RU", { maximumFractionDigits: value >= 1 ? 0 : 1 });
}

export function OverviewTab(state: UseManagerStatisticsPageResult) {
  const { summary, series, groupByMonth, range, openRequests, overviewLoading, period, selectPeriod, officeName } = state;

  const kpis = (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard tone="neutral" icon={Inbox} label="Всего заявок" value={summary.total} onClick={() => openRequests()} title="Открыть список заявок" />
      <KpiCard tone="blue" icon={CircleDot} label="Новые" value={summary.newRequests} onClick={() => openRequests("status", "in_progress")} />
      <KpiCard tone="teal" icon={Users} label="В работе" value={summary.inWork} onClick={() => openRequests("status", "execution")} />
      <KpiCard tone="green" icon={CheckCircle2} label="Завершено" value={summary.completed} share={summary.total ? `${summary.completionRate}%` : undefined} onClick={() => openRequests("status", "completed")} />
      <KpiCard tone="red" icon={AlertTriangle} label="Просрочено" value={summary.overdue} share={summary.total ? `${summary.overdueRate}%` : undefined} onClick={() => openRequests("status", "overdue")} />
      <KpiCard tone="orange" icon={Clock} label="Экстренные" value={summary.urgent} share={summary.total ? `${summary.urgentRate}%` : undefined} onClick={() => openRequests("priority", "urgent")} />
    </div>
  );

  if (overviewLoading) {
    return <div className="space-y-5">{kpis}<LoadingBlock /></div>;
  }

  if (summary.total === 0) {
    const fallback = period === "month" ? { value: "year" as const, label: "Показать за год" } : { value: "month" as const, label: "Показать за месяц" };
    const from = parseDateKey(range.fromKey);
    const to = parseDateKey(range.toKey);
    return (
      <div className="space-y-5">
        {kpis}
        <EmptyPanel
          icon={Inbox}
          title="За выбранный период заявок нет"
          text={`${officeName === "Все офисы" ? "Во всех офисах" : `В ${officeName}`} с ${from.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} по ${to.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} заявок не создавали. Попробуйте другой период или офис.`}
          action={
            <button type="button" onClick={() => selectPeriod(fallback.value)} className="text-sm font-medium text-[#E85D2B] hover:underline">
              {fallback.label}
            </button>
          }
        />
      </div>
    );
  }

  const keys = series.map((p) => p.key);
  const dayLabel = sparseDayLabel(keys);
  const types = [
    { key: "normal", label: "Обычные", value: summary.normal, rate: summary.normalRate, color: "#c7c7cc" },
    { key: "urgent", label: "Экстренные", value: summary.urgent, rate: summary.urgentRate, color: "#E85D2B" },
    { key: "planned", label: "Плановые", value: summary.planned, rate: summary.plannedRate, color: "#3B82F6" },
  ];

  return (
    <div className="space-y-5">
      {kpis}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Panel
          title={groupByMonth ? "Заявки по месяцам" : `Заявки по дням · ${monthSpan(range.fromKey, range.toKey)}`}
          note={groupByMonth ? undefined : `≈ ${formatPerDay(summary.avgPerDay)} в день`}
        >
          <BarChart
            data={series.map((p) => ({
              key: p.key,
              value: p.count,
              ariaLabel: `${p.key}: ${p.count}`,
            }))}
            xLabel={groupByMonth ? (i) => MONTHS_SHORT[Number(keys[i].slice(5, 7)) - 1] : dayLabel}
          />
        </Panel>
        <Panel title="По типам заявок">
          <div className="space-y-5">
            {types.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => openRequests("priority", type.key)}
                className="block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D2B]"
              >
                <span className="mb-2.5 flex items-baseline justify-between gap-3">
                  <span className="text-sm text-white">{type.label}</span>
                  <span className="tabular-nums">
                    <span className="text-base font-semibold text-white">{type.value}</span>
                    <span className="ml-1.5 text-xs text-white/50">{type.rate}%</span>
                  </span>
                </span>
                <ProgressBar value={type.value} max={summary.total} color={type.color} />
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
