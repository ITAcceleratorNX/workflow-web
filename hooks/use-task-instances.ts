"use client";

import { useCallback, useEffect, useState } from "react";
import {
  completeTaskInstance,
  getTaskInstances,
  skipTaskInstance,
  type TaskInstance,
} from "@/lib/recurring-tasks-api";
import { useToast } from "@/hooks/use-toast";

export function useTaskInstances(taskId: number) {
  const { toast } = useToast();
  const [instances, setInstances] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInstances = useCallback(async () => {
    try {
      const response = await getTaskInstances(taskId);
      setInstances(response.data.instances || []);
    } catch {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить экземпляры задачи",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [taskId, toast]);

  useEffect(() => {
    setLoading(true);
    void fetchInstances();
  }, [fetchInstances]);

  const completeInstance = useCallback(
    async (instanceId: number, notes?: string) => {
      setActionLoading(true);
      try {
        await completeTaskInstance(instanceId, notes);
        toast({ title: "Успешно", description: "Экземпляр отмечен как выполненный" });
        await fetchInstances();
      } catch {
        toast({
          title: "Ошибка",
          description: "Не удалось отметить как выполненный",
          variant: "destructive",
        });
      } finally {
        setActionLoading(false);
      }
    },
    [fetchInstances, toast]
  );

  const skipInstance = useCallback(
    async (instanceId: number, notes?: string) => {
      setActionLoading(true);
      try {
        await skipTaskInstance(instanceId, notes);
        toast({ title: "Успешно", description: "Экземпляр пропущен" });
        await fetchInstances();
      } catch {
        toast({
          title: "Ошибка",
          description: "Не удалось пропустить экземпляр",
          variant: "destructive",
        });
      } finally {
        setActionLoading(false);
      }
    },
    [fetchInstances, toast]
  );

  return {
    instances,
    loading,
    actionLoading,
    fetchInstances,
    completeInstance,
    skipInstance,
  };
}

export type UseTaskInstancesResult = ReturnType<typeof useTaskInstances>;
