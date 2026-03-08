import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DaySteps {
  date: string // YYYY-MM-DD
  steps: number
  km: number
}

export interface PedometerSettings {
  heightCm: number
  weightKg: number
  goalSteps: number
  notificationsEnabled: boolean
}

interface PedometerState {
  /** Доступ к данным шагов выдан */
  hasAccess: boolean
  /** Шаги за сегодня */
  stepsToday: number
  /** История за 7 дней (от новых к старым) */
  history: DaySteps[]
  /** Настройки */
  settings: PedometerSettings
  /** Actions */
  setHasAccess: (hasAccess: boolean) => void
  setStepsToday: (steps: number) => void
  setHistory: (history: DaySteps[]) => void
  setSettings: (settings: Partial<PedometerSettings>) => void
  /** Пересчитать цель по формуле */
  recalculateGoal: () => void
  /** Обновить шаги и историю (для тестового режима) */
  setMockSteps: (today: number, history?: DaySteps[]) => void
}

/**
 * Формула цели шагов: 5500 + 15×(Вес−70) + 15×(190−Рост)
 * Округление до 100, границы 4000–10000
 */
function calculateStepGoal(heightCm: number, weightKg: number): number {
  const base = 5500
  const weightAdjust = 15 * (weightKg - 70)
  const heightAdjust = 15 * (190 - heightCm)
  let goal = base + weightAdjust + heightAdjust
  goal = Math.round(goal / 100) * 100
  return Math.max(4000, Math.min(10000, goal))
}

/**
 * Длина шага в метрах (приблизительно по росту)
 * Упрощённая модель: ~0.415 * (рост/100)
 */
function getStepLengthM(heightCm: number): number {
  return (heightCm / 100) * 0.415
}

export function stepsToKm(steps: number, heightCm: number): number {
  const stepLengthM = getStepLengthM(heightCm)
  return (steps * stepLengthM) / 1000
}

const defaultSettings: PedometerSettings = {
  heightCm: 170,
  weightKg: 70,
  goalSteps: 5500,
  notificationsEnabled: true,
}

/** Генерирует тестовую историю за 7 дней */
function generateMockHistory(heightCm: number): DaySteps[] {
  const result: DaySteps[] = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const steps = i === 0 ? 0 : Math.floor(3000 + Math.random() * 4000)
    result.push({
      date: dateStr,
      steps,
      km: Math.round(stepsToKm(steps, heightCm) * 100) / 100,
    })
  }
  return result
}

export const usePedometerStore = create<PedometerState>()(
  persist(
    (set, get) => ({
      hasAccess: false,
      stepsToday: 0,
      history: [],
      settings: defaultSettings,

      setHasAccess: (hasAccess) => set({ hasAccess }),

      setStepsToday: (steps) => set((state) => {
        const height = state.settings.heightCm || 170
        const newHistory = [...state.history]
        const todayStr = new Date().toISOString().slice(0, 10)
        const idx = newHistory.findIndex((h) => h.date === todayStr)
        const dayData: DaySteps = {
          date: todayStr,
          steps,
          km: Math.round(stepsToKm(steps, height) * 100) / 100,
        }
        if (idx >= 0) {
          newHistory[idx] = dayData
        } else {
          newHistory.unshift(dayData)
          if (newHistory.length > 7) newHistory.pop()
        }
        return { stepsToday: steps, history: newHistory }
      }),

      setHistory: (history) => set({ history }),

      setSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings },
      })),

      recalculateGoal: () => {
        const { settings } = get()
        const { heightCm, weightKg } = settings
        if (heightCm > 0 && weightKg > 0) {
          const goal = calculateStepGoal(heightCm, weightKg)
          set((state) => ({
            settings: { ...state.settings, goalSteps: goal },
          }))
        }
      },

      setMockSteps: (today, history) => {
        const { settings } = get()
        const height = settings.heightCm || 170
        let h = history ?? generateMockHistory(height)
        const todayStr = new Date().toISOString().slice(0, 10)
        const todayIdx = h.findIndex((d) => d.date === todayStr)
        if (todayIdx >= 0) {
          h = [...h]
          h[todayIdx] = {
            date: todayStr,
            steps: today,
            km: Math.round(stepsToKm(today, height) * 100) / 100,
          }
        } else {
          h = [{ date: todayStr, steps: today, km: Math.round(stepsToKm(today, height) * 100) / 100 }, ...h].slice(0, 7)
        }
        set({
          stepsToday: today,
          history: h.length > 0 ? h : generateMockHistory(height),
        })
      },
    }),
    {
      name: 'pedometer-storage',
      partialize: (state) => ({
        hasAccess: state.hasAccess,
        stepsToday: state.stepsToday,
        history: state.history,
        settings: state.settings,
      }),
    }
  )
)
