"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import { dateKey, eachDayKey, formatShortDay, parseDateKey } from "@/lib/manager-period";
import type { UseManagerStatisticsPageResult } from "@/hooks/use-manager-statistics-page";
import { cn } from "@/lib/utils";
import { BarChart } from "./bar-chart";
import {
  BarRow,
  EmptyState,
  ErrorBlock,
  formatRating,
  LoadingBlock,
  Panel,
  plural,
  ProgressBar,
  RATING_COLOR,
} from "./stats-ui";

const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function Stars({ value, size = 22 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`${formatRating(value)} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(value >= i - 0.25 ? "fill-[#F5A623] text-[#F5A623]" : "fill-white/10 text-white/10")}
        />
      ))}
    </span>
  );
}

/** Недели (с понедельника) или месяцы, пересекающиеся с периодом. */
function ratingBuckets(fromKey: string, toKey: string) {
  const days = eachDayKey(fromKey, toKey);
  const byMonth = days.length > 93;
  const buckets: { key: string; label: string; days: Set<string> }[] = [];
  for (const key of days) {
    const date = parseDateKey(key);
    let bucketKey: string;
    let label: string;
    if (byMonth) {
      bucketKey = key.slice(0, 7);
      label = `${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
    } else {
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      bucketKey = dateKey(monday);
      const end = sunday > parseDateKey(toKey) ? parseDateKey(toKey) : sunday;
      const start = formatShortDay(dateKey(monday) < fromKey ? fromKey : dateKey(monday));
      const finish = formatShortDay(dateKey(end));
      label = start.split(" ")[1] === finish.split(" ")[1] ? `${start.split(" ")[0]}–${finish}` : `${start} – ${finish}`;
    }
    let bucket = buckets[buckets.length - 1];
    if (!bucket || bucket.key !== bucketKey) {
      bucket = { key: bucketKey, label, days: new Set() };
      buckets.push(bucket);
    }
    bucket.days.add(key);
  }
  return { buckets, byMonth };
}

export function RatingsTab(state: UseManagerStatisticsPageResult) {
  const { analytics, reloadAnalytics, range, officeNameById } = state;
  const ratings = analytics.data?.ratings;

  const dynamics = useMemo(() => {
    if (!ratings) return null;
    const { buckets, byMonth } = ratingBuckets(range.fromKey, range.toKey);
    return {
      byMonth,
      points: buckets.map((bucket) => {
        const rows = ratings.byDate.filter((d) => bucket.days.has(d.date));
        const total = rows.reduce((s, d) => s + d.totalRatings, 0);
        const sum = rows.reduce((s, d) => s + Number(d.avgRating) * d.totalRatings, 0);
        return { key: bucket.key, label: bucket.label, total, avg: total ? sum / total : 0 };
      }),
    };
  }, [ratings, range]);

  if (analytics.error && !ratings) return <ErrorBlock error={analytics.error} onRetry={reloadAnalytics} />;
  if (!ratings || !dynamics) return <LoadingBlock />;

  const { summary } = ratings;
  const avg = Number(summary.avgRating ?? 0);
  const maxCount = Math.max(...Object.values(summary.distribution), 0);
  const lowOffices = ratings.byOffice.filter((o) => o.lowRatings > 0).sort((a, b) => b.lowRatings - a.lowRatings);
  const maxLow = Math.max(...lowOffices.map((o) => o.lowRatings), 0);
  const categories = [...ratings.byCategory].sort((a, b) => Number(b.avgRating) - Number(a.avgRating));

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Panel title="Средняя оценка">
          {summary.totalRatings > 0 ? (
            <>
              <div className="flex items-center gap-4">
                <span className="text-[40px] font-bold leading-none text-white tabular-nums">{formatRating(avg)}</span>
                <Stars value={avg} />
              </div>
              <p className="mt-5 text-sm text-white/50">
                {summary.totalRatings} {plural(summary.totalRatings, "оценка", "оценки", "оценок")} ·{" "}
                {summary.lowRatings > 0 ? `низких (1–2): ${summary.lowRatings}` : "низких (1–2) нет"}
              </p>
            </>
          ) : (
            <EmptyState icon={Star} title="Оценок пока нет" text="Клиенты ставят оценку после завершения заявки." className="py-4" />
          )}
        </Panel>
        <Panel title="Распределение оценок">
          <div className="space-y-3">
            {(["5", "4", "3", "2", "1"] as const).map((score) => (
              <div key={score} className="grid grid-cols-[36px_minmax(0,1fr)_40px] items-center gap-5">
                <span className="flex items-center gap-1 text-sm text-white">
                  {score}
                  <Star className="h-3.5 w-3.5 fill-white text-white" />
                </span>
                <ProgressBar value={summary.distribution[score]} max={maxCount} color={RATING_COLOR} className="h-1.5" />
                <span className="text-right text-sm font-semibold text-white tabular-nums">{summary.distribution[score]}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Низкие оценки по офисам" note="оценки 1–2">
          {lowOffices.length > 0 ? (
            <div className="space-y-4">
              {lowOffices.map((o) => (
                <BarRow key={o.officeId} label={officeNameById(o.officeId)} value={o.lowRatings} max={maxLow} display={o.lowRatings} color="#EF4444" />
              ))}
            </div>
          ) : (
            <EmptyState icon={Star} title="Низких оценок нет" text="За период не было оценок 1–2. Если появятся — здесь будет список офисов." className="py-6" />
          )}
        </Panel>
        <Panel title="Оценки по категориям">
          {categories.length >= 2 ? (
            <div className="space-y-4">
              {categories.map((c) => (
                <BarRow
                  key={c.categoryName}
                  label={c.categoryName}
                  value={Number(c.avgRating)}
                  max={5}
                  display={`${formatRating(c.avgRating)} · ${c.totalRatings} шт.`}
                  color={RATING_COLOR}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Star} title="Пока мало оценок" text="Средняя по категориям появится, когда оценки будут хотя бы в двух категориях." className="py-6" />
          )}
        </Panel>
      </div>

      <Panel title="Динамика оценок" note={dynamics.byMonth ? "средняя по месяцам" : "средняя по неделям"}>
        <BarChart
          data={dynamics.points.map((p) => ({
            key: p.key,
            value: p.avg,
            topLabel: p.total > 0 ? (
              <span className="flex flex-col items-center">
                <span className="text-[13px] font-semibold text-white">{formatRating(p.avg)}</span>
                <span className="text-[10px] font-normal text-white/50">
                  {p.total} {plural(p.total, "оценка", "оценки", "оценок")}
                </span>
              </span>
            ) : (
              <span className="text-[10px] font-normal text-white/40">нет оценок</span>
            ),
            ariaLabel: `${p.label}: ${p.total ? formatRating(p.avg) : "нет оценок"}`,
          }))}
          ticks={[1, 2, 3, 4, 5]}
          minValue={1}
          xLabel={(i) => dynamics.points[i].label}
          color={RATING_COLOR}
          height={150}
          barMaxWidth={72}
        />
      </Panel>
    </div>
  );
}
