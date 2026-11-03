"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { surveysApi } from "@/lib/surveys-api";
import type { SurveyResults } from "@/lib/surveys/types";

/**
 * Итоги опроса (GET /surveys/admin/:id/results): шапка опроса с числом ответов и итоги каждого
 * вопроса из одного снимка. Новая загрузка отменяет прежнюю; прежние данные остаются до новых.
 */
export function useSurveyResults(surveyId: number) {
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    const result = await surveysApi.getResults(surveyId, controller.signal);
    if (controller.signal.aborted) return;
    if (result.ok) setResults(result.data);
    else setError(result.error);
    setLoading(false);
  }, [surveyId]);

  useEffect(() => {
    void reload();
    return () => request.current?.abort();
  }, [reload]);

  return { results, loading, error, reload };
}
