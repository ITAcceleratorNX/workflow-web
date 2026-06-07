"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Footprints } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { SmartDeskCalculatorCompact } from "@/components/yandex-smart-home/smart-desk-calculator-compact";
import { useToast } from "@/hooks/use-toast";
import { requestMotionAndOrientationPermission } from "@/lib/utils";
import { usePedometerStore, stepsToKm } from "@/stores/usePedometerStore";

type StepsTab = "today" | "history" | "settings";

function parseStepsTab(raw: string | null): StepsTab {
  if (raw === "settings" || raw === "history" || raw === "today") return raw;
  return "today";
}

function StepsProgressRing({
  progress,
  stepsToday,
  goal,
}: {
  progress: number;
  stepsToday: number;
  goal: number;
}) {
  const r = 90;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative w-[220px] h-[220px] mx-auto">
      <svg width={220} height={220} className="rotate-[-90deg]">
        <circle cx={110} cy={110} r={r} stroke="#3A3A3C" strokeWidth={12} fill="none" />
        <circle
          cx={110}
          cy={110}
          r={r}
          stroke="#E85D2B"
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-white text-4xl font-bold tabular-nums">
          {stepsToday.toLocaleString("ru-RU")}
        </p>
        {goal > 0 ? (
          <p className="text-[#8E8E93] text-sm mt-1">из {goal.toLocaleString("ru-RU")}</p>
        ) : null}
      </div>
    </div>
  );
}

export function ClientStepsMobileView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<StepsTab>(() =>
    parseStepsTab(searchParams.get("tab"))
  );

  const {
    hasAccess,
    stepsToday,
    history,
    settings: pedometerSettings,
    setHasAccess,
    setSettings: setPedometerSettings,
    recalculateGoal,
    setMockSteps,
  } = usePedometerStore();

  useEffect(() => {
    setActiveTab(parseStepsTab(searchParams.get("tab")));
  }, [searchParams]);

  const goal = pedometerSettings.goalSteps ?? 0;
  const heightCm = pedometerSettings.heightCm || 170;
  const progress = goal > 0 ? Math.min(stepsToday / goal, 1) : 0;

  const handleTabPress = useCallback(
    (tab: StepsTab) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "today") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const q = params.toString();
      router.replace(q ? `/client/steps?${q}` : "/client/steps");
    },
    [router, searchParams]
  );

  const handleRequestStepsAccess = async () => {
    const granted = await requestMotionAndOrientationPermission();
    if (granted) {
      setHasAccess(true);
      setMockSteps(3200);
      toast({
        title: "Доступ выдан",
        description: "Шагомер подключён. Показаны тестовые данные.",
        duration: 2000,
      });
    } else {
      toast({
        title: "Доступ не выдан",
        description: "Разрешите доступ к Motion & Fitness для подсчёта шагов.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (hasAccess && history.length === 0) {
      setMockSteps(stepsToday || 0);
    }
  }, [hasAccess, history.length, setMockSteps, stepsToday]);

  const handleRefresh = async () => {
    await new Promise((r) => setTimeout(r, 500));
  };

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div
          className="min-h-screen bg-background px-4 pt-[max(1rem,env(safe-area-inset-top))]"
          
        >
          <header className="flex items-center gap-2 mb-4 pb-3 border-b border-[#3A3A3C]">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1 -ml-1 text-white"
              aria-label="Назад"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Шаги</h1>
          </header>

          <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[#2C2C2E]">
            {(
              [
                { key: "today" as const, label: "Сегодня" },
                { key: "history" as const, label: "История" },
                { key: "settings" as const, label: "Настройки" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTabPress(key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  activeTab === key ? "bg-[#3A3A3C] text-white" : "text-[#8E8E93]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!hasAccess ? (
            <div className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-8 flex flex-col items-center text-center">
              <Footprints className="w-16 h-16 text-[#8E8E93] mb-4" />
              <p className="text-white font-medium text-lg">Нет доступа к шагам</p>
              <p className="text-[#8E8E93] text-sm mt-2">
                Разрешите доступ к Motion & Fitness, чтобы приложение могло считать ваши шаги.
              </p>
              <button
                type="button"
                onClick={handleRequestStepsAccess}
                className="mt-6 px-6 py-3 rounded-xl font-medium text-white bg-[#E85D2B] active:scale-95"
              >
                Дать доступ
              </button>
            </div>
          ) : (
            <>
              {activeTab === "today" && (
                <div className="space-y-4">
                  <StepsProgressRing progress={progress} stepsToday={stepsToday} goal={goal} />
                  <p className="text-center text-[#8E8E93] text-sm">
                    ~{stepsToKm(stepsToday, heightCm).toFixed(2)} км сегодня
                  </p>
                  <SmartDeskCalculatorCompact />
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-2">
                  {history.length === 0 ? (
                    <p className="text-[#8E8E93] text-center py-8">Пока нет данных</p>
                  ) : (
                    history.map((day) => {
                      const d = new Date(day.date);
                      const isToday = day.date === new Date().toISOString().slice(0, 10);
                      const label = isToday
                        ? "Сегодня"
                        : d.toLocaleDateString("ru-RU", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          });
                      return (
                        <div
                          key={day.date}
                          className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-4 flex justify-between items-center"
                        >
                          <span className="text-white font-medium">{label}</span>
                          <div className="text-right">
                            <span className="text-white font-bold block">
                              {day.steps.toLocaleString("ru-RU")} шагов
                            </span>
                            <span className="text-[#8E8E93] text-sm">{day.km.toFixed(2)} км</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-4">
                    <p className="text-white font-medium mb-3">Рост и вес</p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[#8E8E93] text-xs">Рост (см)</label>
                        <input
                          type="number"
                          value={pedometerSettings.heightCm || ""}
                          onChange={(e) =>
                            setPedometerSettings({ heightCm: Number(e.target.value) || 0 })
                          }
                          placeholder="170"
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#3A3A3C] text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[#8E8E93] text-xs">Вес (кг)</label>
                        <input
                          type="number"
                          value={pedometerSettings.weightKg || ""}
                          onChange={(e) =>
                            setPedometerSettings({ weightKg: Number(e.target.value) || 0 })
                          }
                          placeholder="70"
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#3A3A3C] text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        recalculateGoal();
                        toast({ title: "Цель пересчитана", duration: 2000 });
                      }}
                      className="mt-3 w-full py-2.5 rounded-xl font-medium bg-[#E85D2B] text-white"
                    >
                      Пересчитать
                    </button>
                  </div>

                  <div className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-4">
                    <p className="text-[#8E8E93] text-sm">Рекомендованная цель</p>
                    <p className="text-white text-2xl font-bold mt-1">
                      {pedometerSettings.goalSteps.toLocaleString("ru-RU")} шагов/день
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPedometerSettings({
                        notificationsEnabled: !pedometerSettings.notificationsEnabled,
                      })
                    }
                    className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-4 w-full text-left"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <p className="text-white font-medium">Уведомления шагомера</p>
                        <p className="text-[#8E8E93] text-sm mt-1">
                          50%, почти цель, нет активности
                        </p>
                      </div>
                      <div
                        className={`w-12 h-7 rounded-full flex items-center px-1 shrink-0 ${
                          pedometerSettings.notificationsEnabled ? "bg-[#E85D2B]/40" : "bg-[#3A3A3C]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-all ${
                            pedometerSettings.notificationsEnabled ? "ml-auto" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </PullToRefresh>
    </>
  );
}
