"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { buildHealthyInsight, type HealthyInsightPeriod } from "@/lib/healthy-ai-insights";
import { formatDateForApi } from "@/lib/dateTimeUtils";
import type { EnergyLevel, StressLevel } from "@/stores/mood-store";
import { useMoodStore } from "@/stores/mood-store";
import type { SleepRating } from "@/stores/sleep-store";
import { useSleepStore } from "@/stores/sleep-store";
import { usePedometerStore } from "@/stores/usePedometerStore";
import { useWaterStore } from "@/stores/water-store";

const PERIODS: { key: HealthyInsightPeriod; label: string }[] = [
  { key: "day", label: "День" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
];

function toneClasses(tone: "positive" | "neutral" | "attention") {
  if (tone === "positive") return "text-[#8BC34A]";
  if (tone === "attention") return "text-[#FFB74D]";
  return "text-white";
}

/** Insight tab — локальные AI-инсайты (parity с RN HealthyAiInsights, упрощённый web). */
export function HealthyAiInsightsPanel() {
  const [period, setPeriod] = useState<HealthyInsightPeriod>("day");
  const todayKey = useMemo(() => formatDateForApi(new Date()), []);

  const goalSleepMinutes = useSleepStore((s) => s.settings.goalMinutes);
  const lastNightSleepMinutes = useSleepStore((s) => s.lastNightSleepMinutes);
  const avgSleep7DaysMinutes = useSleepStore((s) => s.avgSleep7DaysMinutes);
  const dayRecords = useSleepStore((s) => s.dayRecords);
  const stepsToday = usePedometerStore((s) => s.stepsToday);
  const stepsGoal = usePedometerStore((s) => s.settings.goalSteps ?? 10000);
  const stepsHistory = usePedometerStore((s) => s.history);
  const heightCm = usePedometerStore((s) => s.settings.heightCm);
  const weightKg = usePedometerStore((s) => s.settings.weightKg);
  const intakeTodayMl = useWaterStore((s) => s.intakeTodayMl);
  const healthWaterTodayMl = useWaterStore((s) => s.healthWaterTodayMl);
  const getTodayGoalMl = useWaterStore((s) => s.getTodayGoalMl);
  const moodRecords = useMoodStore((s) => s.records);

  const todaySleepRating = dayRecords[todayKey]?.rating ?? null;
  const waterIntakeMl = intakeTodayMl + (healthWaterTodayMl ?? 0);
  const waterGoalMl = getTodayGoalMl({
    heightCm,
    weightKg,
    stepsToday,
    sleepRating: todaySleepRating,
  });
  const moodToday = moodRecords[todayKey] ?? null;

  const moodRecordsByDate = useMemo(() => {
    const o: Record<string, { moodValue: number; energy: EnergyLevel; stress: StressLevel }> = {};
    for (const [k, v] of Object.entries(moodRecords)) {
      o[k] = { moodValue: v.moodValue, energy: v.energy, stress: v.stress };
    }
    return o;
  }, [moodRecords]);

  const sleepRatingsByDate = useMemo(() => {
    const o: Record<string, SleepRating> = {};
    for (const [k, v] of Object.entries(dayRecords)) {
      if (v.rating) o[k] = v.rating;
    }
    return o;
  }, [dayRecords]);

  const insight = useMemo(
    () =>
      buildHealthyInsight({
        period,
        todayKey,
        goalSleepMinutes,
        lastNightSleepMinutes,
        avgSleep7DaysMinutes,
        todaySleepRating,
        stepsToday,
        stepsGoal,
        stepsHistory: stepsHistory.map((h) => ({ date: h.date, steps: h.steps })),
        waterIntakeMl,
        waterGoalMl,
        moodToday: moodToday
          ? { moodValue: moodToday.moodValue, energy: moodToday.energy, stress: moodToday.stress }
          : null,
        moodRecordsByDate,
        sleepRatingsByDate,
      }),
    [
      period,
      todayKey,
      goalSleepMinutes,
      lastNightSleepMinutes,
      avgSleep7DaysMinutes,
      todaySleepRating,
      stepsToday,
      stepsGoal,
      stepsHistory,
      waterIntakeMl,
      waterGoalMl,
      moodToday,
      moodRecordsByDate,
      sleepRatingsByDate,
    ]
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium ${
              period === p.key ? "bg-[#3A3A3C] text-white" : "text-[#8E8E93]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#7B6FF7]" />
          <span className="text-[#8E8E93] text-sm">AI-инсайт</span>
        </div>
        <p className={`text-xl font-bold mb-2 ${toneClasses(insight.statusTone)}`}>
          {insight.statusLabel}
        </p>
        <p className="text-[#8E8E93] text-sm mb-4">{insight.summary}</p>
        {insight.supportMessage ? (
          <p className="text-white/80 text-sm mb-4">{insight.supportMessage}</p>
        ) : null}

        {insight.recommendations.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-white font-medium text-sm">Рекомендации</p>
            {insight.recommendations.slice(0, 3).map((rec, i) => (
              <p key={i} className="text-[#8E8E93] text-sm">
                • {rec}
              </p>
            ))}
          </div>
        )}

        {insight.weakPoints.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {insight.weakPoints.map((wp) => (
              <span
                key={wp.id}
                className="px-2.5 py-1 rounded-full bg-[#3A3A3C] text-[#8E8E93] text-xs"
              >
                {wp.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Компактная карточка для вкладки «Сегодня». */
export function TodayAiSummaryCard({ onPressMore }: { onPressMore: () => void }) {
  const todayKey = useMemo(() => formatDateForApi(new Date()), []);
  const goalSleepMinutes = useSleepStore((s) => s.settings.goalMinutes);
  const lastNightSleepMinutes = useSleepStore((s) => s.lastNightSleepMinutes);
  const avgSleep7DaysMinutes = useSleepStore((s) => s.avgSleep7DaysMinutes);
  const dayRecords = useSleepStore((s) => s.dayRecords);
  const stepsToday = usePedometerStore((s) => s.stepsToday);
  const stepsGoal = usePedometerStore((s) => s.settings.goalSteps ?? 10000);
  const stepsHistory = usePedometerStore((s) => s.history);
  const heightCm = usePedometerStore((s) => s.settings.heightCm);
  const weightKg = usePedometerStore((s) => s.settings.weightKg);
  const intakeTodayMl = useWaterStore((s) => s.intakeTodayMl);
  const healthWaterTodayMl = useWaterStore((s) => s.healthWaterTodayMl);
  const getTodayGoalMl = useWaterStore((s) => s.getTodayGoalMl);
  const moodRecords = useMoodStore((s) => s.records);
  const todaySleepRating = dayRecords[todayKey]?.rating ?? null;
  const moodToday = moodRecords[todayKey] ?? null;
  const waterIntakeMl = intakeTodayMl + (healthWaterTodayMl ?? 0);
  const waterGoalMl = getTodayGoalMl({
    heightCm,
    weightKg,
    stepsToday,
    sleepRating: todaySleepRating,
  });

  const moodRecordsByDate = useMemo(() => {
    const o: Record<string, { moodValue: number; energy: EnergyLevel; stress: StressLevel }> = {};
    for (const [k, v] of Object.entries(moodRecords)) {
      o[k] = { moodValue: v.moodValue, energy: v.energy, stress: v.stress };
    }
    return o;
  }, [moodRecords]);

  const sleepRatingsByDate = useMemo(() => {
    const o: Record<string, SleepRating> = {};
    for (const [k, v] of Object.entries(dayRecords)) {
      if (v.rating) o[k] = v.rating;
    }
    return o;
  }, [dayRecords]);

  const insight = useMemo(
    () =>
      buildHealthyInsight({
        period: "day",
        todayKey,
        goalSleepMinutes,
        lastNightSleepMinutes,
        avgSleep7DaysMinutes,
        todaySleepRating,
        stepsToday,
        stepsGoal,
        stepsHistory: stepsHistory.map((h) => ({ date: h.date, steps: h.steps })),
        waterIntakeMl,
        waterGoalMl,
        moodToday: moodToday
          ? { moodValue: moodToday.moodValue, energy: moodToday.energy, stress: moodToday.stress }
          : null,
        moodRecordsByDate,
        sleepRatingsByDate,
      }),
    [
      todayKey,
      goalSleepMinutes,
      lastNightSleepMinutes,
      avgSleep7DaysMinutes,
      todaySleepRating,
      stepsToday,
      stepsGoal,
      stepsHistory,
      waterIntakeMl,
      waterGoalMl,
      moodToday,
      moodRecordsByDate,
      sleepRatingsByDate,
    ]
  );

  return (
    <div className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-xl bg-[rgba(123,111,247,0.18)] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#7B6FF7]" />
        </div>
        <span className="text-[#8E8E93] text-sm">Твоя цель:</span>
      </div>
      <p className="text-white font-semibold text-lg mb-2 line-clamp-3">{insight.statusLabel}</p>
      <p className="text-[#8E8E93] text-sm mb-4 line-clamp-3">{insight.summary}</p>
      <button
        type="button"
        onClick={onPressMore}
        className="w-full py-2.5 rounded-xl bg-[#3A3A3C] text-white text-sm font-medium active:scale-[0.98]"
      >
        Подробнее
      </button>
    </div>
  );
}
