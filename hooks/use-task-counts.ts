"use client";

import { useCallback, useEffect, useState } from "react";
import { getTaskCounts, type TaskCounts } from "@/lib/user-tasks-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserTasksInvalidateStore } from "@/stores/user-tasks-invalidate-store";

/**
 * Badges of the task tabs for the user's day. Reloaded after every change of a task (the shared
 * invalidation version), when the connection comes back and on `reload`; the last known numbers
 * stay while a reload runs or fails.
 */
export function useTaskCounts(todayKey: string): { counts: TaskCounts | null; reload: () => void } {
  const [counts, setCounts] = useState<TaskCounts | null>(null);
  const [attempt, setAttempt] = useState(0);
  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.isGuest);
  const version = useUserTasksInvalidateStore((s) => s.version);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    window.addEventListener("online", reload);
    return () => window.removeEventListener("online", reload);
  }, [reload]);

  useEffect(() => {
    if (!token || isGuest) {
      setCounts(null);
      return;
    }
    let cancelled = false;
    void getTaskCounts(todayKey).then((res) => {
      if (!cancelled && res.ok) setCounts(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [token, isGuest, todayKey, version, attempt]);

  return { counts, reload };
}
