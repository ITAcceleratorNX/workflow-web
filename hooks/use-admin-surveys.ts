"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { surveysApi } from "@/lib/surveys-api";
import type { AdminSurvey } from "@/lib/surveys/types";

/**
 * Опросы Администратора (GET /surveys/admin): все статусы, новые сверху. Фильтр «Статус» выбирает из
 * них на месте, без новых запросов. Новая загрузка отменяет прежнюю; прежние данные остаются до новых.
 */
export function useAdminSurveys() {
  const [surveys, setSurveys] = useState<AdminSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    const result = await surveysApi.listAdminSurveys(undefined, controller.signal);
    if (controller.signal.aborted) return;
    if (result.ok) setSurveys(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    return () => request.current?.abort();
  }, [reload]);

  return { surveys, loading, error, reload };
}
