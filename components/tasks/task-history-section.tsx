"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { formatRequestDate } from "@/lib/dateTimeUtils";
import { describeTaskEvent, getTaskHistory, type TaskEvent } from "@/lib/task-recipients-api";
import type { UserTask } from "@/lib/user-tasks-api";
import { cn } from "@/lib/utils";

export type TaskDetailColors = {
  text: string;
  textMuted: string;
  primary: string;
  cardBg: string;
  border: string;
};

type Props = {
  task: Pick<UserTask, "id" | "completed" | "responsible_id" | "updated_at">;
  colors: TaskDetailColors;
  desktop?: boolean;
};

/**
 * Единый журнал задачи: создание и первый получатель, передачи, ответственный, завершение и
 * возврат в работу — с датой и временем. Видят автор, текущие и бывшие участники.
 */
export function TaskHistorySection({ task, colors, desktop = false }: Props) {
  const { text, textMuted, primary, cardBg, border } = colors;
  // Перечитывается после завершения, возврата, передачи и смены ответственного.
  const historyKey = `${task.id}:${task.completed}:${task.responsible_id ?? ""}:${task.updated_at}`;
  const [state, setState] = useState<{ key: string; events: TaskEvent[]; error: string | null } | null>(null);
  const events = state?.events ?? [];
  const loading = state?.key !== historyKey;

  useEffect(() => {
    let cancelled = false;
    void getTaskHistory(task.id).then((res) => {
      if (cancelled) return;
      setState(res.ok ? { key: historyKey, events: res.data, error: null } : { key: historyKey, events: [], error: res.error });
    });
    return () => {
      cancelled = true;
    };
  }, [task.id, historyKey]);

  return (
    <>
      <p
        className={cn("font-semibold px-1", desktop ? "text-sm text-[#8E8E93] mb-0.5" : "text-xs uppercase tracking-wide")}
        style={desktop ? undefined : { color: textMuted }}
      >
        История
      </p>
      <div
        className={cn("rounded-2xl border overflow-hidden", desktop && "border-[#3A3A3C] shadow-sm")}
        style={{ backgroundColor: desktop ? "#2C2C2E" : cardBg, borderColor: border }}
      >
        {loading && events.length === 0 ? (
          <div className="flex justify-center py-5">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: primary }} />
          </div>
        ) : events.length === 0 ? (
          <p className="px-3 py-4 text-sm" style={{ color: textMuted }}>
            {state?.error ?? "Пока нет действий"}
          </p>
        ) : (
          events.map((e, i) => (
            <div key={`${e.id}:${e.action}`}>
              {i > 0 ? <div className="h-px mx-3" style={{ backgroundColor: border }} /> : null}
              <div className="px-3 py-2.5">
                <p className="text-sm" style={{ color: text }}>
                  {describeTaskEvent(e)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                  {formatRequestDate(e.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
