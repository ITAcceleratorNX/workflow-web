"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_TASK_SORT, parseTaskSort, type TaskSort } from "@/lib/task-list-sort";

export type SortableTaskView = "inbox" | "today";

const STORAGE_KEY = "workflow.tasks.sort.v1";
type StoredSorts = Record<SortableTaskView, TaskSort>;
const DEFAULTS: StoredSorts = { inbox: DEFAULT_TASK_SORT, today: DEFAULT_TASK_SORT };

function readStored(): StoredSorts {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<StoredSorts> | null;
    return { inbox: parseTaskSort(raw?.inbox), today: parseTaskSort(raw?.today) };
  } catch {
    return DEFAULTS;
  }
}

/** The order chosen for each of «Входящие» and «Сегодня», remembered on this device. */
export function useTaskSortPreference() {
  const [sorts, setSorts] = useState<StoredSorts>(DEFAULTS);
  useEffect(() => setSorts(readStored()), []);

  const setSort = useCallback((view: SortableTaskView, sort: TaskSort) => {
    setSorts((previous) => {
      const next = { ...previous, [view]: sort };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Private mode or blocked storage: the choice lasts until the page is reloaded.
      }
      return next;
    });
  }, []);

  return { sorts, setSort };
}
