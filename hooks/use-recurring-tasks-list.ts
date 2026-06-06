"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getRecurringTasks,
  toggleRecurringTask,
  type RecurringTask,
} from "@/lib/recurring-tasks-api";
import { useToast } from "@/hooks/use-toast";

export function useRecurringTasksList() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await getRecurringTasks();
      setTasks(response.data.tasks || []);
    } catch {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить повторяющиеся задачи",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const handleToggleTask = useCallback(
    async (taskId: number, action: "pause" | "resume") => {
      try {
        await toggleRecurringTask(taskId, action);
        toast({
          title: "Успешно",
          description: `Задача ${action === "pause" ? "приостановлена" : "возобновлена"}`,
        });
        await fetchTasks();
      } catch {
        toast({
          title: "Ошибка",
          description: "Не удалось изменить статус задачи",
          variant: "destructive",
        });
      }
    },
    [fetchTasks, toast]
  );

  return {
    tasks,
    loading,
    fetchTasks,
    handleToggleTask,
  };
}

export type UseRecurringTasksListResult = ReturnType<typeof useRecurringTasksList>;
