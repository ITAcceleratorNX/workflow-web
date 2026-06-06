"use client";

import { Sparkles } from "lucide-react";
import { useTodayTasks } from "@/hooks/use-today-tasks";

type TasksTodayCardProps = {
  onPress: () => void;
};

/** Карточка продуктивности на главной — parity с workflow-mobile TasksTodayCard. */
export function TasksTodayCard({ onPress }: TasksTodayCardProps) {
  const { stats, loading } = useTodayTasks();
  const { todayCompleted, todayTotal } = stats;
  const percent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full rounded-2xl bg-[#2C2C2E] border border-[#3A3A3C] p-4 text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E85D2B]/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#E85D2B]" />
          </div>
          <div>
            <p className="text-white font-medium">Продуктивность за сегодня</p>
            <p className="text-sm text-gray-400">
              {loading ? "Загрузка…" : `Выполнено ${todayCompleted} из ${todayTotal}`}
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-[#E85D2B] px-2 py-1 rounded-lg bg-[#E85D2B]/10 min-w-[54px] text-center">
          {loading ? "—" : `${percent}%`}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-[#E85D2B]/20 overflow-hidden">
        <div
          className="h-full bg-[#E85D2B] rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-[#8E8E93] mt-2.5 font-medium">
        Нажмите, чтобы открыть задачи (Сегодня)
      </p>
    </button>
  );
}
