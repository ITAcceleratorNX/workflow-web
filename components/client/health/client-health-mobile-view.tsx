"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Footprints,
  Moon,
  Bell,
  Target,
} from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import {
  HealthyAiInsightsPanel,
  TodayAiSummaryCard,
} from "@/components/health/healthy-ai-insights-panel";
import { MoodCheckInCard } from "@/components/health/mood-check-in-card";
import { formatDateForApi } from "@/lib/dateTimeUtils";
import { formatLiters, sleepRatingLabel } from "@/lib/health-format";
import {
  formatSleepDuration,
  useSleepStore,
} from "@/stores/sleep-store";
import { usePedometerStore } from "@/stores/usePedometerStore";
import { useWaterStore, WATER_PORTIONS } from "@/stores/water-store";

type HealthyTab = "today" | "insight" | "settings";

const TABS: { key: HealthyTab; label: string }[] = [
  { key: "today", label: "Сегодня" },
  { key: "insight", label: "Insight" },
  { key: "settings", label: "Настройки" },
];

function VisualMiniCard({
  icon,
  iconBg,
  title,
  primaryLine,
  subtitle,
  emptyHint,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  primaryLine?: string;
  subtitle?: string;
  emptyHint: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: iconBg }}
            >
              {icon}
            </div>
            <span className="text-white font-semibold">{title}</span>
          </div>
          {primaryLine ? (
            <>
              <p className="text-white font-medium">{primaryLine}</p>
              {subtitle ? <p className="text-[#8E8E93] text-sm mt-0.5">{subtitle}</p> : null}
            </>
          ) : (
            <p className="text-[#8E8E93] text-sm">{emptyHint}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-[#8E8E93] shrink-0 mt-1" />
      </div>
    </>
  );

  const className =
    "block w-full text-left rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-4 mb-3 active:scale-[0.98] transition-transform";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function WaterAddModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const todayKey = useMemo(() => formatDateForApi(new Date()), []);
  const addWater = useWaterStore((s) => s.addWater);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-semibold text-lg">Добавить воду</p>
          <button type="button" onClick={onClose} className="text-[#8E8E93] p-1">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {WATER_PORTIONS.map((ml) => (
            <button
              key={ml}
              type="button"
              onClick={() => {
                addWater(ml, todayKey);
                onClose();
              }}
              className="py-3 rounded-xl bg-[#3A3A3C] text-white text-sm font-medium active:scale-95"
            >
              {ml >= 1000 ? `${ml / 1000} л` : `${ml} мл`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WaterNormaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const manualGoalMl = useWaterStore((s) => s.manualGoalMl);
  const setManualGoal = useWaterStore((s) => s.setManualGoal);
  const getTodayGoalMl = useWaterStore((s) => s.getTodayGoalMl);
  const heightCm = usePedometerStore((s) => s.settings.heightCm);
  const weightKg = usePedometerStore((s) => s.settings.weightKg);
  const stepsToday = usePedometerStore((s) => s.stepsToday);
  const todayKey = useMemo(() => formatDateForApi(new Date()), []);
  const todaySleepRating = useSleepStore((s) => s.dayRecords[todayKey]?.rating ?? null);
  const autoGoalMl = getTodayGoalMl({ heightCm, weightKg, stepsToday, sleepRating: todaySleepRating });
  const [draft, setDraft] = useState(manualGoalMl != null ? String(manualGoalMl) : "");

  useEffect(() => {
    if (open) setDraft(manualGoalMl != null ? String(manualGoalMl) : "");
  }, [open, manualGoalMl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5">
        <p className="text-white font-semibold text-lg mb-2">Норма воды</p>
        <p className="text-[#8E8E93] text-sm mb-4">
          Авто-расчёт: {formatLiters(autoGoalMl)} (по росту, весу, шагам и сну)
        </p>
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="мл (пусто = авто)"
          className="w-full px-4 py-3 rounded-xl bg-[#3A3A3C] text-white placeholder-[#8E8E93] mb-4"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const trimmed = draft.trim();
              if (!trimmed) {
                setManualGoal(null);
              } else {
                const ml = parseInt(trimmed, 10);
                if (Number.isFinite(ml) && ml > 0) setManualGoal(ml);
              }
              onClose();
            }}
            className="flex-1 py-3 rounded-xl bg-[#E85D2B] text-white font-medium"
          >
            Сохранить
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#3A3A3C] text-white"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClientHealthMobileView() {
  const router = useRouter();
  const [tab, setTab] = useState<HealthyTab>("today");
  const [waterAddOpen, setWaterAddOpen] = useState(false);
  const [waterNormaOpen, setWaterNormaOpen] = useState(false);

  const todayKey = useMemo(() => formatDateForApi(new Date()), []);
  const ensureDateSync = useWaterStore((s) => s.ensureDateSync);

  useEffect(() => {
    ensureDateSync(todayKey);
  }, [ensureDateSync, todayKey]);

  const lastNightMinutes = useSleepStore((s) => s.lastNightSleepMinutes);
  const sleepRating = useSleepStore((s) => s.dayRecords[todayKey]?.rating ?? null);
  const stepsToday = usePedometerStore((s) => s.stepsToday);
  const stepsGoal = usePedometerStore((s) => s.settings.goalSteps ?? 10000);
  const heightCm = usePedometerStore((s) => s.settings.heightCm);
  const weightKg = usePedometerStore((s) => s.settings.weightKg);
  const intakeTodayMl = useWaterStore((s) => s.intakeTodayMl);
  const healthWaterTodayMl = useWaterStore((s) => s.healthWaterTodayMl);
  const getTodayGoalMl = useWaterStore((s) => s.getTodayGoalMl);
  const manualGoalMl = useWaterStore((s) => s.manualGoalMl);
  const pedometerSettings = usePedometerStore((s) => s.settings);

  const totalWaterMl = intakeTodayMl + (healthWaterTodayMl ?? 0);
  const waterGoalMl = getTodayGoalMl({
    heightCm,
    weightKg,
    stepsToday,
    sleepRating,
  });

  const handleRefresh = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 500));
  }, []);

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div
          className="min-h-screen bg-[#1C1C1E] px-4 pt-[max(1rem,env(safe-area-inset-top))]"
          
        >
          <header className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1 -ml-1 text-white"
              aria-label="Назад"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <h1 className="text-xl font-bold text-white flex-1 text-center pr-8">Healthy</h1>
          </header>

          <div className="flex gap-1 mb-4 p-1 rounded-xl bg-[#2C2C2E]">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key ? "bg-[#3A3A3C] text-white" : "text-[#8E8E93]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "today" && (
            <>
              <TodayAiSummaryCard onPressMore={() => setTab("insight")} />
              <VisualMiniCard
                icon={<Moon className="w-5 h-5 text-[#7B6FF7]" />}
                iconBg="rgba(123, 111, 247, 0.18)"
                title="Сон"
                primaryLine={
                  lastNightMinutes != null ? formatSleepDuration(lastNightMinutes) : undefined
                }
                subtitle={sleepRating ? sleepRatingLabel(sleepRating) : undefined}
                emptyHint="Укажите сон"
                href="/client/sleep"
              />
              <VisualMiniCard
                icon={<Droplets className="w-5 h-5 text-[#4FC3F7]" />}
                iconBg="rgba(79, 195, 247, 0.18)"
                title="Вода"
                primaryLine={
                  totalWaterMl > 0
                    ? `${formatLiters(totalWaterMl)} из ${formatLiters(waterGoalMl)}`
                    : undefined
                }
                subtitle={totalWaterMl > 0 ? undefined : "Добавьте воду"}
                emptyHint="Добавьте воду"
                onClick={() => setWaterAddOpen(true)}
              />
              <VisualMiniCard
                icon={<Footprints className="w-5 h-5 text-[#FF8A50]" />}
                iconBg="rgba(255, 138, 80, 0.22)"
                title="Шаги"
                primaryLine={
                  stepsToday > 0 ? `${stepsToday.toLocaleString("ru-RU")} шагов` : undefined
                }
                subtitle={
                  stepsToday > 0
                    ? `Цель ${stepsGoal.toLocaleString("ru-RU")}`
                    : "Заполните данные"
                }
                emptyHint="Заполните данные"
                href="/client/steps"
              />
              <MoodCheckInCard />
            </>
          )}

          {tab === "insight" && <HealthyAiInsightsPanel />}

          {tab === "settings" && (
            <div className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] overflow-hidden">
              {[
                {
                  icon: <Moon className="w-5 h-5 text-[#7B6FF7]" />,
                  iconBg: "rgba(123, 111, 247, 0.18)",
                  label: "Сон",
                  sub: "Расписание и оценка",
                  href: "/client/sleep",
                },
                {
                  icon: <Footprints className="w-5 h-5 text-[#FF8A50]" />,
                  iconBg: "rgba(255, 138, 80, 0.22)",
                  label: "Шаги",
                  sub: "Цель и параметры",
                  href: "/client/steps",
                },
                {
                  icon: <Droplets className="w-5 h-5 text-[#4FC3F7]" />,
                  iconBg: "rgba(79, 195, 247, 0.18)",
                  label: "Норма воды",
                  sub: manualGoalMl
                    ? `${formatLiters(manualGoalMl)} (вручную)`
                    : `${formatLiters(waterGoalMl)} (авто)`,
                  onClick: () => setWaterNormaOpen(true),
                },
                {
                  icon: <Target className="w-5 h-5 text-[#8BC34A]" />,
                  iconBg: "rgba(76, 175, 80, 0.18)",
                  label: "Цели",
                  sub: `Сон ${Math.floor(useSleepStore.getState().settings.goalMinutes / 60)}ч · Шаги ${pedometerSettings.goalSteps.toLocaleString("ru-RU")}`,
                  onClick: () => setTab("today"),
                },
                {
                  icon: <Bell className="w-5 h-5 text-[#FFC107]" />,
                  iconBg: "rgba(255, 193, 7, 0.18)",
                  label: "Уведомления",
                  sub: "Настройки Healthy",
                  href: "/notifications",
                },
              ].map((row, i, arr) => {
                const inner = (
                  <div
                    className={`flex items-center gap-3 px-4 py-4 ${
                      i < arr.length - 1 ? "border-b border-[#3A3A3C]" : ""
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: row.iconBg }}
                    >
                      {row.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{row.label}</p>
                      {row.sub ? (
                        <p className="text-[#8E8E93] text-sm truncate">{row.sub}</p>
                      ) : null}
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#8E8E93]" />
                  </div>
                );

                if ("href" in row && row.href) {
                  return (
                    <Link key={row.label} href={row.href} className="block active:bg-white/5">
                      {inner}
                    </Link>
                  );
                }

                return (
                  <button
                    key={row.label}
                    type="button"
                    onClick={row.onClick}
                    className="w-full text-left active:bg-white/5"
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      <WaterAddModal open={waterAddOpen} onClose={() => setWaterAddOpen(false)} />
      <WaterNormaModal open={waterNormaOpen} onClose={() => setWaterNormaOpen(false)} />
    </>
  );
}
