import { create } from "zustand";
import { persist } from "zustand/middleware";
import { formatDateForApi } from "@/lib/dateTimeUtils";
import { calculateWaterGoal, type WaterGoalInput, WATER_PORTIONS } from "@/lib/water-utils";

export { WATER_PORTIONS };

export interface WaterDayRecord {
  date: string;
  intakeMl: number;
  goalMl: number;
}

interface WaterState {
  intakeTodayMl: number;
  lastDate: string | null;
  manualGoalMl: number | null;
  healthWaterTodayMl: number | null;

  addWater: (ml: number, dateKey: string) => void;
  setManualGoal: (ml: number | null) => void;
  setHealthWaterToday: (ml: number | null) => void;
  getTodayGoalMl: (input: Omit<WaterGoalInput, "healthWaterTodayMl">) => number;
  ensureDateSync: (dateKey: string) => void;
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set, get) => ({
      intakeTodayMl: 0,
      lastDate: null,
      manualGoalMl: null,
      healthWaterTodayMl: null,

      addWater: (ml, dateKey) => {
        const state = get();
        const today = formatDateForApi(new Date());
        if (dateKey !== today) return;

        set({
          intakeTodayMl: state.intakeTodayMl + ml,
          lastDate: today,
        });
      },

      setManualGoal: (ml) => set({ manualGoalMl: ml }),

      setHealthWaterToday: (ml) => set({ healthWaterTodayMl: ml }),

      getTodayGoalMl: (input) => {
        const { manualGoalMl, healthWaterTodayMl } = get();
        if (manualGoalMl != null && manualGoalMl > 0) return manualGoalMl;
        return calculateWaterGoal({
          ...input,
          healthWaterTodayMl,
        });
      },

      ensureDateSync: (dateKey) => {
        const { lastDate } = get();
        if (lastDate && lastDate !== dateKey) {
          set({ intakeTodayMl: 0, lastDate: dateKey });
        }
      },
    }),
    {
      name: "water-storage",
      partialize: (state) => ({
        intakeTodayMl: state.intakeTodayMl,
        lastDate: state.lastDate,
        manualGoalMl: state.manualGoalMl,
      }),
    }
  )
);
