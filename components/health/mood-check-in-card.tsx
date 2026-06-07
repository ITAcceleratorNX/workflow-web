"use client";

import { useCallback, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { formatDateForApi } from "@/lib/dateTimeUtils";
import type { EnergyLevel, StressLevel } from "@/stores/mood-store";
import { useMoodStore } from "@/stores/mood-store";

const MOOD_LEVELS = [
  { level: 0 as const, moodValue: 88, summary: "Хорошее настроение" },
  { level: 1 as const, moodValue: 58, summary: "Нормальное настроение" },
  { level: 2 as const, moodValue: 35, summary: "Плохое настроение" },
  { level: 3 as const, moodValue: 12, summary: "Очень плохое настроение" },
] as const;

const ENERGY_LEVEL_DEFS: {
  key: EnergyLevel;
  fill: number;
  fillColor: keyof typeof COLORS;
  borderActive: keyof typeof COLORS;
}[] = [
  { key: "full", fill: 1, fillColor: "energyFull", borderActive: "energyFull" },
  { key: "good", fill: 0.7, fillColor: "energyGood", borderActive: "energyGood" },
  { key: "low", fill: 0.3, fillColor: "energyLow", borderActive: "energyLow" },
  { key: "depleted", fill: 0.1, fillColor: "energyDepleted", borderActive: "energyDepleted" },
];

const STRESS_LEVELS = [
  { key: "calm" as const, level: 0 as const, summary: "Спокойно" },
  { key: "neutral" as const, level: 1 as const, summary: "Нейтрально" },
  { key: "tense" as const, level: 2 as const, summary: "Напряжённо" },
  { key: "overloaded" as const, level: 3 as const, summary: "Перегружен" },
];

const COLORS = {
  cardBg: "#2C2C2E",
  trackBg: "#3A3A3C",
  accent: "#E85D2B",
  textPrimary: "#ffffff",
  textMuted: "#8E8E93",
  glyphStroke: "#5C5C5E",
  chipBg: "#3A3A3C",
  chipSelectedBg: "rgba(232, 93, 43, 0.18)",
  onPrimary: "#ffffff",
  iconWrapMood: "rgba(129, 199, 132, 0.25)",
  iconWrapEnergy: "rgba(174, 213, 129, 0.22)",
  iconWrapStress: "rgba(179, 229, 252, 0.2)",
  moodGood: "#8BC34A",
  moodOk: "#C5A572",
  moodBad: "#E89B5C",
  moodVeryBad: "#E57373",
  energyFull: "#7CB342",
  energyGood: "#AED581",
  energyLow: "#FFA726",
  energyDepleted: "#E53935",
  stressCalm: "#81C784",
  stressNeutral: "#B0BEC5",
  stressTense: "#FFB74D",
  stressOverload: "#E57373",
} as const;

type AdviceIconKind = "leaf" | "spark" | "breath" | "ripple" | "mug" | "pulse";

const MOOD_MOUTH: Record<0 | 1 | 2 | 3, string> = {
  0: "M 26 58 Q 50 78 74 58",
  1: "M 30 60 Q 50 70 70 60",
  2: "M 30 64 Q 50 54 70 64",
  3: "M 28 66 Q 50 46 72 66",
};

function moodLevelIndex(moodValue: number): number {
  let best = 0;
  let d = Infinity;
  MOOD_LEVELS.forEach((L, i) => {
    const diff = Math.abs(L.moodValue - moodValue);
    if (diff < d) {
      d = diff;
      best = i;
    }
  });
  return best;
}

function moodSummaryFromValue(moodValue: number): string {
  return MOOD_LEVELS[moodLevelIndex(moodValue)].summary;
}

function moodColorFromValue(moodValue: number): string {
  if (moodValue >= 70) return COLORS.moodGood;
  if (moodValue >= 45) return COLORS.moodOk;
  if (moodValue >= 22) return COLORS.moodBad;
  return COLORS.moodVeryBad;
}

function getRecommendation(
  moodValue: number,
  energy: EnergyLevel,
  stress: StressLevel
): { text: string; icon: AdviceIconKind } {
  const energyBad = energy === "depleted" || energy === "low";
  const energyGood = energy === "full" || energy === "good";
  const stressLow = stress === "calm";

  if (moodValue < 28 && energyBad && stress === "overloaded") {
    return {
      text: "Сегодня лучше отдохнуть. Короткая прогулка или расслабляющее занятие помогут. Помните: отдых — это нормально.",
      icon: "leaf",
    };
  }
  if (moodValue > 72 && energyGood && stressLow) {
    return {
      text: "Вы в отличной форме! Идеальный день для сложных задач или активного отдыха.",
      icon: "spark",
    };
  }
  if (stress === "overloaded") {
    return {
      text: "Высокий уровень стресса. Попробуйте 10 минут глубокого дыхания или медитации. Вы справитесь!",
      icon: "breath",
    };
  }
  if (stress === "tense") {
    return {
      text: "Заметное напряжение. Короткая пауза без экрана или лёгкая растяжка могут снять зажим.",
      icon: "ripple",
    };
  }
  if (energy === "depleted" || energy === "low") {
    return {
      text: "Мало энергии? Короткий отдых или полезный перекус могут помочь. Пейте воду и делайте перерывы.",
      icon: "mug",
    };
  }
  return {
    text: "Всё идёт хорошо! Поддерживайте баланс: регулярные перерывы и забота о себе.",
    icon: "pulse",
  };
}

function energyBadgeLabel(energy: EnergyLevel): string {
  switch (energy) {
    case "full":
      return "Полный заряд";
    case "good":
      return "Хороший заряд";
    case "low":
      return "Низкий заряд";
    default:
      return "Почти разряжен";
  }
}

function MoodFaceGlyph({ level, size = 36 }: { level: 0 | 1 | 2 | 3; size?: number }) {
  const eyeY = level >= 3 ? 40 : 38;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="44" fill={COLORS.trackBg} stroke={COLORS.glyphStroke} strokeWidth="2" />
      <ellipse cx="36" cy={eyeY} rx="6" ry={level >= 2 ? 5 : 6} fill={COLORS.textPrimary} />
      <ellipse cx="64" cy={eyeY} rx="6" ry={level >= 2 ? 5 : 6} fill={COLORS.textPrimary} />
      {level === 0 && (
        <>
          <circle cx="26" cy="52" r="4" fill={COLORS.accent} opacity={0.45} />
          <circle cx="74" cy="52" r="4" fill={COLORS.accent} opacity={0.45} />
        </>
      )}
      <path
        d={MOOD_MOUTH[level]}
        stroke={COLORS.textPrimary}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function StressFaceGlyph({ level, size = 36 }: { level: 0 | 1 | 2 | 3; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="44" fill={COLORS.trackBg} stroke={COLORS.glyphStroke} strokeWidth="2" />
      {level === 0 && (
        <>
          <path d="M 28 44 Q 36 38 44 44" stroke={COLORS.stressCalm} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 56 44 Q 64 38 72 44" stroke={COLORS.stressCalm} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 32 62 Q 50 72 68 62" stroke={COLORS.stressCalm} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </>
      )}
      {level === 1 && (
        <>
          <circle cx="36" cy="42" r="4.5" fill={COLORS.stressNeutral} />
          <circle cx="64" cy="42" r="4.5" fill={COLORS.stressNeutral} />
          <line x1="32" y1="60" x2="68" y2="60" stroke={COLORS.stressNeutral} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {level === 2 && (
        <>
          <line x1="28" y1="36" x2="40" y2="40" stroke={COLORS.stressTense} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="36" x2="60" y2="40" stroke={COLORS.stressTense} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="36" cy="44" r="4" fill={COLORS.stressTense} />
          <circle cx="64" cy="44" r="4" fill={COLORS.stressTense} />
          <path
            d="M 30 64 L 38 58 L 46 64 L 54 58 L 62 64 L 70 58"
            stroke={COLORS.stressTense}
            strokeWidth="2.5"
            fill="none"
            strokeLinejoin="round"
          />
        </>
      )}
      {level === 3 && (
        <>
          <circle cx="36" cy="40" r="5" fill={COLORS.stressOverload} />
          <circle cx="64" cy="40" r="5" fill={COLORS.stressOverload} />
          <path
            d="M 32 28 L 36 22 M 64 22 L 68 28 M 22 50 L 16 48 M 84 48 L 78 50"
            stroke={COLORS.stressOverload}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.85}
          />
          <path d="M 28 66 Q 50 52 72 66" stroke={COLORS.stressOverload} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M 18 32 L 22 36 M 82 36 L 86 32" stroke={COLORS.accent} strokeWidth="1.8" strokeLinecap="round" opacity={0.6} />
        </>
      )}
    </svg>
  );
}

function BatteryGlyph({
  fillRatio,
  fillColor,
  strokeColor,
  size = 40,
}: {
  fillRatio: number;
  fillColor: string;
  strokeColor: string;
  size?: number;
}) {
  const w = size;
  const h = size * 0.52;
  const capW = size * 0.09;
  const capH = size * 0.22;
  const r = size * 0.12;
  const bodyPad = size * 0.08;
  const innerW = w - capW - bodyPad * 2;
  const innerH = h - bodyPad * 2;
  const tipX = bodyPad + innerW + bodyPad * 0.25;
  const strokeW = size * 0.06;
  const inset = strokeW * 0.55 + size * 0.028;
  const bodyWidth = innerW + bodyPad * 0.4;
  const fillLeft = bodyPad + inset;
  const fillMaxW = Math.max(0, bodyWidth - 2 * inset);
  const fillW = Math.max(0, fillMaxW * fillRatio);
  const fillTop = bodyPad + inset;
  const fillHeight = Math.max(0, innerH - 2 * inset);
  const fillRx = Math.max(1, r * 0.45 - inset * 0.35);

  return (
    <svg width={w} height={h + 2} viewBox={`0 0 ${w} ${h + 2}`} aria-hidden>
      <rect
        x={bodyPad}
        y={bodyPad}
        width={bodyWidth}
        height={innerH}
        rx={r}
        ry={r}
        stroke={strokeColor}
        strokeWidth={strokeW}
        fill="none"
      />
      <rect
        x={tipX}
        y={h / 2 - capH / 2}
        width={capW}
        height={capH}
        rx={capW * 0.35}
        ry={capW * 0.35}
        fill={strokeColor}
      />
      <rect
        x={fillLeft}
        y={fillTop}
        width={fillW}
        height={fillHeight}
        rx={fillRx}
        ry={fillRx}
        fill={fillColor}
      />
    </svg>
  );
}

function AdviceGlyph({ kind, size = 40 }: { kind: AdviceIconKind; size?: number }) {
  const a = COLORS.accent;
  const w = COLORS.textPrimary;
  const m = COLORS.textMuted;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {kind === "leaf" && (
        <path
          d="M 50 18 C 78 22 88 48 50 88 C 12 48 22 22 50 18 Z"
          fill="none"
          stroke={COLORS.moodGood}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
      {kind === "spark" && (
        <>
          <path d="M 50 12 L 54 40 L 82 50 L 54 58 L 50 88 L 46 58 L 18 50 L 46 40 Z" fill={a} opacity={0.9} />
          <circle cx="50" cy="50" r="8" fill={COLORS.onPrimary} opacity={0.35} />
        </>
      )}
      {kind === "breath" && (
        <>
          <path d="M 50 22 C 70 38 70 62 50 78 C 30 62 30 38 50 22" fill="none" stroke={m} strokeWidth="2.5" />
          <path d="M 50 32 C 62 42 62 58 50 68 C 38 58 38 42 50 32" fill="none" stroke={a} strokeWidth="2" />
        </>
      )}
      {kind === "ripple" && (
        <>
          <circle cx="50" cy="50" r="28" fill="none" stroke={m} strokeWidth="2" opacity={0.5} />
          <circle cx="50" cy="50" r="18" fill="none" stroke={a} strokeWidth="2" opacity={0.7} />
          <circle cx="50" cy="50" r="8" fill={a} opacity={0.35} />
        </>
      )}
      {kind === "mug" && (
        <>
          <rect x="28" y="38" width="34" height="30" rx="8" fill="none" stroke={w} strokeWidth="3" />
          <path
            d="M 62 46 H 72 C 78 46 82 52 82 58 C 82 64 76 68 70 68 H 62"
            fill="none"
            stroke={w}
            strokeWidth="2.8"
          />
          <path d="M 34 72 Q 50 80 66 72" fill="none" stroke={a} strokeWidth="2.5" opacity={0.8} />
        </>
      )}
      {kind === "pulse" && (
        <path
          d="M 22 50 L 38 50 L 44 30 L 56 70 L 62 50 L 78 50"
          fill="none"
          stroke={COLORS.moodGood}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function LevelRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 mb-5">{children}</div>;
}

function LevelCell({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex-1 aspect-square max-w-[25.5%] rounded-[14px] border flex items-center justify-center transition-all ${
        active ? "border-[#E85D2B] bg-[rgba(232,93,43,0.18)]" : "border-transparent bg-[#3A3A3C]"
      }`}
    >
      {children}
    </button>
  );
}

/** Parity с workflow-mobile MoodCheckInCard — пошаговый wizard. */
export function MoodCheckInCard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [moodValue, setMoodValue] = useState(58);
  const [energy, setEnergy] = useState<EnergyLevel>("good");
  const [stress, setStress] = useState<StressLevel>("neutral");

  const setMood = useMoodStore((s) => s.setMood);
  const todayKey = useMemo(() => formatDateForApi(new Date()), []);

  const recommendation = useMemo(
    () => getRecommendation(moodValue, energy, stress),
    [moodValue, energy, stress]
  );

  const handleFinish = useCallback(() => {
    setMood(todayKey, {
      moodValue,
      energy,
      stress,
      recommendation: recommendation.text,
    });
    setStep(4);
  }, [moodValue, energy, stress, recommendation.text, setMood, todayKey]);

  const moodIdx = moodLevelIndex(moodValue);
  const previewMoodLevel = MOOD_LEVELS[moodIdx].level;
  const energyDef = ENERGY_LEVEL_DEFS.find((e) => e.key === energy) ?? ENERGY_LEVEL_DEFS[1];
  const stressDef = STRESS_LEVELS.find((s) => s.key === stress) ?? STRESS_LEVELS[1];

  return (
    <div className="rounded-[20px] bg-[#2C2C2E] border border-[#3A3A3C] p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-[#E85D2B]" fill="#E85D2B" />
        <p className="text-white font-semibold text-[17px]">Проверка настроения</p>
      </div>

      {step === 1 && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: COLORS.iconWrapMood }}
            >
              <MoodFaceGlyph level={1} size={32} />
            </div>
            <div>
              <p className="text-white font-bold text-[17px]">Настроение</p>
              <p className="text-[#8E8E93] text-[13px] mt-0.5">Как вы себя чувствуете?</p>
            </div>
          </div>

          <div className="min-h-[120px] flex flex-col items-center justify-center mb-3">
            <MoodFaceGlyph level={previewMoodLevel} size={80} />
            <p
              className="text-sm font-semibold mt-2 text-center"
              style={{ color: moodColorFromValue(moodValue) }}
            >
              {moodSummaryFromValue(moodValue)}
            </p>
          </div>

          <LevelRow>
            {MOOD_LEVELS.map((L, i) => (
              <LevelCell
                key={L.moodValue}
                active={moodIdx === i}
                onClick={() => setMoodValue(L.moodValue)}
                label={L.summary}
              >
                <MoodFaceGlyph level={L.level} size={36} />
              </LevelCell>
            ))}
          </LevelRow>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full py-3.5 rounded-3xl bg-[#E85D2B] text-white font-semibold text-base active:scale-[0.98] transition-transform"
          >
            Далее
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: COLORS.iconWrapEnergy }}
            >
              <BatteryGlyph
                fillRatio={0.85}
                fillColor={COLORS.energyGood}
                strokeColor={COLORS.textMuted}
                size={36}
              />
            </div>
            <div>
              <p className="text-white font-bold text-[17px]">Энергия</p>
              <p className="text-[#8E8E93] text-[13px] mt-0.5">Оцените свой уровень энергии</p>
            </div>
          </div>

          <div className="min-h-[120px] flex flex-col items-center justify-center mb-3">
            <BatteryGlyph
              fillRatio={energyDef.fill}
              fillColor={COLORS[energyDef.fillColor]}
              strokeColor={COLORS[energyDef.borderActive]}
              size={72}
            />
          </div>

          <LevelRow>
            {ENERGY_LEVEL_DEFS.map((def) => {
              const active = energy === def.key;
              return (
                <LevelCell
                  key={def.key}
                  active={active}
                  onClick={() => setEnergy(def.key)}
                  label={def.key}
                >
                  <BatteryGlyph
                    fillRatio={def.fill}
                    fillColor={COLORS[def.fillColor]}
                    strokeColor={active ? COLORS[def.borderActive] : COLORS.textMuted}
                    size={40}
                  />
                </LevelCell>
              );
            })}
          </LevelRow>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3.5 rounded-3xl bg-[#3A3A3C] text-white font-medium text-base"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 py-3.5 rounded-3xl bg-[#E85D2B] text-white font-semibold text-base"
            >
              Далее
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: COLORS.iconWrapStress }}
            >
              <StressFaceGlyph level={0} size={32} />
            </div>
            <div>
              <p className="text-white font-bold text-[17px]">Стресс</p>
              <p className="text-[#8E8E93] text-[13px] mt-0.5">Насколько вы чувствуете нагрузку?</p>
            </div>
          </div>

          <div className="min-h-[120px] flex flex-col items-center justify-center mb-3">
            <StressFaceGlyph level={stressDef.level} size={80} />
            <p className="text-[#8E8E93] text-sm font-semibold mt-2 text-center">{stressDef.summary}</p>
          </div>

          <LevelRow>
            {STRESS_LEVELS.map((s) => (
              <LevelCell
                key={s.key}
                active={stress === s.key}
                onClick={() => setStress(s.key)}
                label={s.summary}
              >
                <StressFaceGlyph level={s.level} size={36} />
              </LevelCell>
            ))}
          </LevelRow>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 py-3.5 rounded-3xl bg-[#3A3A3C] text-white font-medium text-base"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="flex-1 py-3.5 rounded-3xl bg-[#E85D2B] text-white font-semibold text-base"
            >
              Готово
            </button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div className="rounded-2xl bg-[#3A3A3C] p-5">
            <div className="flex gap-3 mb-4 items-start">
              <div className="w-10 h-10 shrink-0 mt-0.5">
                <AdviceGlyph kind={recommendation.icon} size={40} />
              </div>
              <div>
                <p className="text-white font-semibold text-base mb-2">Совет на день</p>
                <p className="text-[#8E8E93] text-sm leading-[22px]">{recommendation.text}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2C2C2E]">
                <MoodFaceGlyph level={MOOD_LEVELS[moodIdx].level} size={22} />
                <span className="text-[#8E8E93] text-xs">{moodSummaryFromValue(moodValue)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2C2C2E]">
                <BatteryGlyph
                  fillRatio={energyDef.fill}
                  fillColor={COLORS[energyDef.fillColor]}
                  strokeColor={COLORS[energyDef.borderActive]}
                  size={22}
                />
                <span className="text-[#8E8E93] text-xs">{energyBadgeLabel(energy)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2C2C2E]">
                <StressFaceGlyph level={stressDef.level} size={22} />
                <span className="text-[#8E8E93] text-xs">{stressDef.summary}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full mt-4 py-3.5 rounded-3xl bg-[#3A3A3C] text-white font-medium text-base"
          >
            Обновить
          </button>
        </>
      )}
    </div>
  );
}
