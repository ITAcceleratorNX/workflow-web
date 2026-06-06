"use client";

import { useCallback, useMemo, useState } from "react";
import { formatDateForApi } from "@/lib/dateTimeUtils";
import type { EnergyLevel, StressLevel } from "@/stores/mood-store";
import { useMoodStore } from "@/stores/mood-store";

const MOOD_LEVELS = [
  { level: 0, moodValue: 88, summary: "Хорошее настроение", color: "#8BC34A" },
  { level: 1, moodValue: 58, summary: "Нормальное настроение", color: "#C5A572" },
  { level: 2, moodValue: 35, summary: "Плохое настроение", color: "#E89B5C" },
  { level: 3, moodValue: 12, summary: "Очень плохое настроение", color: "#E57373" },
] as const;

const ENERGY_OPTIONS: { key: EnergyLevel; label: string }[] = [
  { key: "full", label: "Полная" },
  { key: "good", label: "Хорошая" },
  { key: "low", label: "Низкая" },
  { key: "depleted", label: "Нет сил" },
];

const STRESS_OPTIONS: { key: StressLevel; label: string }[] = [
  { key: "calm", label: "Спокойно" },
  { key: "neutral", label: "Нейтрально" },
  { key: "tense", label: "Напряжённо" },
  { key: "overloaded", label: "Перегружен" },
];

function getRecommendation(moodValue: number, energy: EnergyLevel, stress: StressLevel): string {
  const energyBad = energy === "depleted" || energy === "low";
  const energyGood = energy === "full" || energy === "good";

  if (moodValue < 28 && energyBad && stress === "overloaded") {
    return "Сегодня лучше отдохнуть. Короткая прогулка или расслабляющее занятие помогут.";
  }
  if (moodValue > 72 && energyGood && stress === "calm") {
    return "Вы в отличной форме! Идеальный день для сложных задач или активного отдыха.";
  }
  if (stress === "overloaded") {
    return "Высокий уровень стресса. Попробуйте 10 минут глубокого дыхания или медитации.";
  }
  if (stress === "tense") {
    return "Заметное напряжение. Короткая пауза без экрана или лёгкая растяжка могут снять зажим.";
  }
  if (energyBad) {
    return "Мало энергии? Короткий отдых или полезный перекус могут помочь.";
  }
  return "Всё идёт хорошо! Поддерживайте баланс: регулярные перерывы и забота о себе.";
}

/** Parity с workflow-mobile MoodCheckInCard (упрощённый web). */
export function MoodCheckInCard() {
  const todayKey = useMemo(() => formatDateForApi(new Date()), []);
  const todayRecord = useMoodStore((s) => s.records[todayKey] ?? null);
  const setMood = useMoodStore((s) => s.setMood);

  const [moodLevel, setMoodLevel] = useState(() => {
    if (!todayRecord) return 1;
    const closest = MOOD_LEVELS.reduce((best, L) =>
      Math.abs(L.moodValue - todayRecord.moodValue) < Math.abs(best.moodValue - todayRecord.moodValue)
        ? L
        : best
    );
    return closest.level;
  });
  const [energy, setEnergy] = useState<EnergyLevel>(todayRecord?.energy ?? "good");
  const [stress, setStress] = useState<StressLevel>(todayRecord?.stress ?? "neutral");

  const moodDef = MOOD_LEVELS[moodLevel] ?? MOOD_LEVELS[1];
  const recommendation = useMemo(
    () => getRecommendation(moodDef.moodValue, energy, stress),
    [moodDef.moodValue, energy, stress]
  );

  const save = useCallback(() => {
    setMood(todayKey, {
      moodValue: moodDef.moodValue,
      energy,
      stress,
      recommendation,
    });
  }, [todayKey, moodDef.moodValue, energy, stress, recommendation, setMood]);

  return (
    <div className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[rgba(129,199,132,0.25)] flex items-center justify-center text-lg">
          🙂
        </div>
        <div>
          <p className="text-white font-semibold">Как вы себя чувствуете?</p>
          <p className="text-[#8E8E93] text-sm">{moodDef.summary}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {MOOD_LEVELS.map((m) => (
          <button
            key={m.level}
            type="button"
            onClick={() => {
              setMoodLevel(m.level);
            }}
            className={`flex-1 h-10 rounded-xl border-2 transition-all ${
              moodLevel === m.level ? "border-[#E85D2B] scale-105" : "border-transparent bg-[#3A3A3C]"
            }`}
            style={{ backgroundColor: moodLevel === m.level ? `${m.color}33` : undefined }}
            aria-label={m.summary}
          />
        ))}
      </div>

      <p className="text-[#8E8E93] text-xs mb-2">Энергия</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {ENERGY_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setEnergy(opt.key)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              energy === opt.key
                ? "bg-[rgba(232,93,43,0.18)] text-[#E85D2B] border border-[#E85D2B]/40"
                : "bg-[#3A3A3C] text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <p className="text-[#8E8E93] text-xs mb-2">Стресс</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {STRESS_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setStress(opt.key)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              stress === opt.key
                ? "bg-[rgba(232,93,43,0.18)] text-[#E85D2B] border border-[#E85D2B]/40"
                : "bg-[#3A3A3C] text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <p className="text-[#8E8E93] text-sm mb-4">{recommendation}</p>

      <button
        type="button"
        onClick={save}
        className="w-full py-3 rounded-xl bg-[#E85D2B] text-white font-medium active:scale-[0.98] transition-transform"
      >
        {todayRecord ? "Обновить" : "Сохранить"}
      </button>
    </div>
  );
}
