"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { surveysApi } from "@/lib/surveys-api";
import type { AdminSurveyDetail } from "@/lib/surveys/types";

/**
 * Опрос Администратора с вопросами (GET /surveys/admin/:id) — для предпросмотра из списка. Новая
 * загрузка отменяет прежнюю; прежние данные остаются до новых.
 */
export function useAdminSurvey(surveyId: number) {
  const [survey, setSurvey] = useState<AdminSurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    const result = await surveysApi.getAdminSurvey(surveyId, controller.signal);
    if (controller.signal.aborted) return;
    if (result.ok) setSurvey(result.data);
    else setError(result.error);
    setLoading(false);
  }, [surveyId]);

  useEffect(() => {
    void reload();
    return () => request.current?.abort();
  }, [reload]);

  return { survey, loading, error, reload };
}
