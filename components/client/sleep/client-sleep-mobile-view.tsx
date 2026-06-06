"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Lightbulb, Moon, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import PullToRefresh from "@/components/pull-to-refresh";
import { MOBILE_BOTTOM_NAV_PADDING } from "@/constants/mobile-layout";
import { formatDateForApi } from "@/lib/dateTimeUtils";
import {
  formatSleepDuration,
  FULL_SLEEP_ADVICE,
  getScheduledSleepMinutes,
  type SleepRating,
  useSleepStore,
} from "@/stores/sleep-store";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

const BEDTIME_OPTIONS = [
  [20, 0], [20, 30], [21, 0], [21, 30], [22, 0], [22, 30], [23, 0], [23, 30], [0, 0],
];
const WAKE_OPTIONS = [
  [5, 0], [5, 30], [6, 0], [6, 30], [7, 0], [7, 30], [8, 0], [8, 30], [9, 0],
];

function SleepSurveyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const todayKey = useMemo(() => formatDateForApi(new Date()), []);
  const setSleepRating = useSleepStore((s) => s.setSleepRating);
  const settings = useSleepStore((s) => s.settings);
  const setLastNightSleep = useSleepStore((s) => s.setLastNightSleep);

  if (!open) return null;

  const options: { key: SleepRating; label: string }[] = [
    { key: "poor", label: "Не выспался" },
    { key: "ok", label: "Можно и лучше" },
    { key: "good", label: "Выспался" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5">
        <p className="text-white font-semibold text-lg mb-4">Как вы спали?</p>
        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setSleepRating(todayKey, opt.key);
                setLastNightSleep(getScheduledSleepMinutes(settings));
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-[#3A3A3C] text-white text-left px-4"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClientSleepMobileView() {
  const router = useRouter();
  const todayKey = useMemo(() => formatDateForApi(new Date()), []);
  const settings = useSleepStore((s) => s.settings);
  const setSettings = useSleepStore((s) => s.setSettings);
  const dayRecord = useSleepStore((s) => s.dayRecords[todayKey]);
  const recommendations = dayRecord?.recommendations ?? [];
  const rating = dayRecord?.rating ?? null;
  const lastNightMinutes = useSleepStore((s) => s.lastNightSleepMinutes);
  const avg7DaysMinutes = useSleepStore((s) => s.avgSleep7DaysMinutes);
  const requestSurveyShow = useSleepStore((s) => s.requestSurveyShow);
  const forceShowSurvey = useSleepStore((s) => s.forceShowSurvey);
  const clearForceShowSurvey = useSleepStore((s) => s.clearForceShowSurvey);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<"bed" | "wake" | null>(null);
  const [surveyOpen, setSurveyOpen] = useState(false);

  const goalHours = Math.floor(settings.goalMinutes / 60);
  const scheduledMinutes = getScheduledSleepMinutes(settings);
  const scheduleWarning = scheduledMinutes < settings.goalMinutes;
  const bedtimeStr = `${pad2(settings.bedtimeHour)}:${pad2(settings.bedtimeMinute)}`;
  const wakeStr = `${pad2(settings.wakeHour)}:${pad2(settings.wakeMinute)}`;
  const options = timePickerMode === "bed" ? BEDTIME_OPTIONS : WAKE_OPTIONS;

  const handleTimeSelect = useCallback(
    (hour: number, minute: number) => {
      if (timePickerMode === "bed") {
        setSettings({ bedtimeHour: hour, bedtimeMinute: minute });
      } else {
        setSettings({ wakeHour: hour, wakeMinute: minute });
      }
      setTimePickerMode(null);
    },
    [timePickerMode, setSettings]
  );

  const openSurvey = () => {
    requestSurveyShow();
    setSurveyOpen(true);
  };

  useEffect(() => {
    if (forceShowSurvey) {
      setSurveyOpen(true);
      clearForceShowSurvey();
    }
  }, [forceShowSurvey, clearForceShowSurvey]);

  const handleRefresh = async () => {
    await new Promise((r) => setTimeout(r, 500));
  };

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div
          className="min-h-screen bg-[#1C1C1E] px-4 pt-[max(1rem,env(safe-area-inset-top))]"
          style={{ paddingBottom: MOBILE_BOTTOM_NAV_PADDING }}
        >
          <header className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1 text-[#E85D2B] p-1 -ml-1"
            >
              <ChevronLeft className="w-6 h-6" />
              <span>Назад</span>
            </button>
          </header>

          <h1 className="text-2xl font-bold text-white mb-6">Сон</h1>

          {recommendations.length > 0 && (
            <div className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#E85D2B] flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <p className="text-white font-semibold">Рекомендации на сегодня</p>
              </div>
              {recommendations.map((rec, i) => (
                <p key={i} className="text-[#8E8E93] text-sm mb-2">
                  • {rec}
                </p>
              ))}
              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                className="flex items-center gap-1 text-[#E85D2B] text-sm font-medium mt-2"
              >
                Подробнее
              </button>
            </div>
          )}

          <div className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5 mb-4">
            <Moon className="w-6 h-6 text-[#E85D2B] mb-2" />
            <p className="text-white font-semibold mb-3">Сон прошлой ночи</p>
            {lastNightMinutes != null ? (
              <>
                <p className="text-white text-3xl font-bold">
                  {formatSleepDuration(lastNightMinutes)}
                </p>
                {rating != null && (
                  <p className="text-[#8E8E93] text-sm mt-1">Оценка по расписанию</p>
                )}
                {avg7DaysMinutes != null && (
                  <p className="text-[#8E8E93] text-sm mt-2">
                    Среднее за 7 дней: {formatSleepDuration(avg7DaysMinutes)}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-[#8E8E93] text-sm mb-4">
                  Оцените сон, чтобы увидеть длительность
                </p>
                <button
                  type="button"
                  onClick={openSurvey}
                  className="px-6 py-3 rounded-xl bg-[#E85D2B] text-white font-medium"
                >
                  Оценить сон
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-5 mb-4">
            <p className="text-white font-semibold mb-4">Расписание сна</p>

            <div className="py-3 border-b border-[#3A3A3C]">
              <p className="text-white mb-2">Цель сна</p>
              <div className="flex gap-2">
                {[6, 7, 8, 9].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSettings({ goalMinutes: h * 60 })}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      goalHours === h ? "bg-[#E85D2B] text-white" : "bg-[#3A3A3C] text-white"
                    }`}
                  >
                    {h}ч
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTimePickerMode("bed")}
              className="w-full flex justify-between items-center py-3 border-b border-[#3A3A3C] text-left"
            >
              <span className="text-white">Отход ко сну</span>
              <span className="text-[#E85D2B] font-medium">{bedtimeStr}</span>
            </button>

            <button
              type="button"
              onClick={() => setTimePickerMode("wake")}
              className="w-full flex justify-between items-center py-3 border-b border-[#3A3A3C] text-left"
            >
              <span className="text-white">Пробуждение</span>
              <span className="text-[#E85D2B] font-medium">{wakeStr}</span>
            </button>

            {scheduleWarning && (
              <p className="text-[#FFB74D] text-sm mt-3 p-3 rounded-xl bg-[rgba(255,183,77,0.12)]">
                Расписание ({formatSleepDuration(scheduledMinutes)}) короче цели (
                {formatSleepDuration(settings.goalMinutes)})
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                setSettings({ notificationsEnabled: !settings.notificationsEnabled })
              }
              className="w-full flex justify-between items-center py-3 mt-2"
            >
              <span className="text-white">Уведомления</span>
              <div
                className={`w-12 h-7 rounded-full flex items-center px-1 ${
                  settings.notificationsEnabled ? "bg-[#E85D2B]/40" : "bg-[#3A3A3C]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white ${
                    settings.notificationsEnabled ? "ml-auto" : ""
                  }`}
                />
              </div>
            </button>
          </div>

          {rating == null && lastNightMinutes != null && (
            <button
              type="button"
              onClick={openSurvey}
              className="w-full py-3 rounded-xl border border-[#E85D2B] text-[#E85D2B] font-medium"
            >
              Изменить оценку сна
            </button>
          )}
        </div>
      </PullToRefresh>

      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
          <div className="w-full max-h-[85vh] rounded-t-2xl bg-[#2C2C2E] border border-[#3A3A3C] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#3A3A3C]">
              <p className="text-white font-semibold">Как улучшить сон</p>
              <button type="button" onClick={() => setShowDetailModal(false)}>
                <X className="w-6 h-6 text-[#8E8E93]" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <pre className="text-[#8E8E93] text-sm whitespace-pre-wrap font-sans">
                {rating ? FULL_SLEEP_ADVICE[rating] : recommendations[0] ?? ""}
              </pre>
            </div>
          </div>
        </div>
      )}

      {timePickerMode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-4 max-h-[50vh] overflow-y-auto">
            <p className="text-white font-semibold mb-3">
              {timePickerMode === "bed" ? "Отход ко сну" : "Пробуждение"}
            </p>
            <div className="space-y-1">
              {options.map(([h, m]) => (
                <button
                  key={`${h}-${m}`}
                  type="button"
                  onClick={() => handleTimeSelect(h, m)}
                  className="w-full py-3 rounded-xl bg-[#3A3A3C] text-white text-left px-4"
                >
                  {pad2(h)}:{pad2(m)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTimePickerMode(null)}
              className="w-full mt-3 py-3 text-[#8E8E93]"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <SleepSurveyModal open={surveyOpen} onClose={() => setSurveyOpen(false)} />

      <BottomNav activeTab="home" />
    </>
  );
}
