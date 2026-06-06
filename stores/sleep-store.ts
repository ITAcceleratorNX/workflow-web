import { create } from "zustand";
import { persist } from "zustand/middleware";
import { formatDateForApi } from "@/lib/dateTimeUtils";

export type SleepRating = "poor" | "ok" | "good";

export interface SleepSettings {
  goalMinutes: number;
  bedtimeHour: number;
  bedtimeMinute: number;
  wakeHour: number;
  wakeMinute: number;
  notificationsEnabled: boolean;
}

export interface SleepDayRecord {
  date: string;
  rating: SleepRating;
  recommendations: string[];
}

const DEFAULT_GOAL_MINUTES = 480;
const DEFAULT_BEDTIME = { hour: 22, minute: 0 };
const DEFAULT_WAKE = { hour: 7, minute: 0 };

const initialSettings: SleepSettings = {
  goalMinutes: DEFAULT_GOAL_MINUTES,
  bedtimeHour: DEFAULT_BEDTIME.hour,
  bedtimeMinute: DEFAULT_BEDTIME.minute,
  wakeHour: DEFAULT_WAKE.hour,
  wakeMinute: DEFAULT_WAKE.minute,
  notificationsEnabled: true,
};

interface SleepState {
  settings: SleepSettings;
  dayRecords: Record<string, SleepDayRecord>;
  forceShowSurvey: boolean;
  lastSleepSurveyAutoPromptDate: string | null;
  lastNightSleepMinutes: number | null;
  avgSleep7DaysMinutes: number | null;
  healthAccessGranted: boolean | null;

  setSettings: (s: Partial<SleepSettings>) => void;
  setSleepRating: (dateKey: string, rating: SleepRating) => void;
  getTodayRating: () => SleepRating | null;
  getTodayRecommendations: () => string[];
  setLastNightSleep: (minutes: number | null) => void;
  setAvgSleep7Days: (minutes: number | null) => void;
  setHealthAccess: (granted: boolean | null) => void;
  requestSurveyShow: () => void;
  clearForceShowSurvey: () => void;
  markSleepSurveyAutoPromptShown: (dateKey: string) => void;
}

const RECOMMENDATIONS: Record<SleepRating, string[]> = {
  poor: [
    "Сну нужно уделить внимание. Попробуйте ложиться в одно время и избегайте экранов за 1 час до сна.",
    "Избегайте кофеина после 14:00.",
    "Создайте расслабляющий ритуал перед сном.",
    "Проветривайте комнату перед сном.",
  ],
  ok: [
    "Неплохо! Попробуйте ложиться чуть раньше для лучшего результата.",
    "Избегайте тяжёлой пищи за 2–3 часа до сна.",
  ],
  good: ["Отлично! Вы хорошо выспались.", "Сохраняйте привычный режим сна."],
};

export const FULL_SLEEP_ADVICE: Record<SleepRating, string> = {
  poor: `Как улучшить сон и высыпаться

1. Режим сна
Ложитесь и вставайте в одно и то же время каждый день, даже в выходные.

2. Подготовка ко сну
• За 1–2 часа до сна избегайте экранов.
• Создайте расслабляющий ритуал: тёплый душ, чтение, лёгкая растяжка.
• Проветривайте комнату — прохладный воздух (18–20°C) способствует засыпанию.

3. Питание и напитки
• Избегайте кофеина после 14:00.
• Не ешьте тяжёлую пищу за 2–3 часа до сна.`,
  ok: `Как сделать сон ещё лучше

1. Время отхода ко сну
Попробуйте ложиться на 15–30 минут раньше.

2. Питание
• Избегайте тяжёлой и острой пищи за 2–3 часа до сна.

3. Расслабление
• Вечерний ритуал: чай без кофеина, чтение, медитация.`,
  good: `Как сохранить хороший сон

1. Режим
Продолжайте ложиться и вставать в одно время.

2. Привычки
• Сохраняйте вечерний ритуал расслабления.
• Избегайте экранов за час до сна.`,
};

export const useSleepStore = create<SleepState>()(
  persist(
    (set, get) => ({
      settings: initialSettings,
      dayRecords: {},
      forceShowSurvey: false,
      lastSleepSurveyAutoPromptDate: null,
      lastNightSleepMinutes: null,
      avgSleep7DaysMinutes: null,
      healthAccessGranted: null,

      setSettings: (s) =>
        set((state) => ({
          settings: { ...state.settings, ...s },
        })),

      setSleepRating: (dateKey, rating) =>
        set((state) => ({
          dayRecords: {
            ...state.dayRecords,
            [dateKey]: {
              date: dateKey,
              rating,
              recommendations: RECOMMENDATIONS[rating],
            },
          },
          lastNightSleepMinutes: getScheduledSleepMinutes(state.settings),
        })),

      getTodayRating: () => {
        const key = formatDateForApi(new Date());
        return get().dayRecords[key]?.rating ?? null;
      },

      getTodayRecommendations: () => {
        const key = formatDateForApi(new Date());
        return get().dayRecords[key]?.recommendations ?? [];
      },

      setLastNightSleep: (minutes) => set({ lastNightSleepMinutes: minutes }),
      setAvgSleep7Days: (minutes) => set({ avgSleep7DaysMinutes: minutes }),
      setHealthAccess: (granted) => set({ healthAccessGranted: granted }),
      requestSurveyShow: () => set({ forceShowSurvey: true }),
      clearForceShowSurvey: () => set({ forceShowSurvey: false }),
      markSleepSurveyAutoPromptShown: (dateKey) =>
        set({ lastSleepSurveyAutoPromptDate: dateKey }),
    }),
    {
      name: "sleep-storage",
      partialize: (state) => ({
        settings: state.settings,
        dayRecords: state.dayRecords,
        lastNightSleepMinutes: state.lastNightSleepMinutes,
        avgSleep7DaysMinutes: state.avgSleep7DaysMinutes,
        lastSleepSurveyAutoPromptDate: state.lastSleepSurveyAutoPromptDate,
      }),
    }
  )
);

export function getScheduledSleepMinutes(settings: SleepSettings): number {
  const bedM = settings.bedtimeHour * 60 + settings.bedtimeMinute;
  let wakeM = settings.wakeHour * 60 + settings.wakeMinute;
  if (wakeM <= bedM) wakeM += 24 * 60;
  return wakeM - bedM;
}

export function formatSleepDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}ч`;
  return `${h}ч ${m}м`;
}
