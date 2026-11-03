"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { surveysApi } from "@/lib/surveys-api";
import type { ClientSurveyDetail } from "@/lib/surveys/types";

/**
 * Опрос клиента (GET /surveys/:id): состояние и вопросы, пока его можно пройти. `missing` — опрос
 * недоступен (404: другой офис, удалён, черновик). `enabled: false` — гостю и по неверному адресу
 * ничего не запрашивается. Новая загрузка отменяет прежнюю; прежние данные остаются до новых.
 */
export function useClientSurvey(surveyId: number | null, { enabled = true }: { enabled?: boolean } = {}) {
  const active = enabled && surveyId != null;
  const [survey, setSurvey] = useState<ClientSurveyDetail | null>(null);
  const [loading, setLoading] = useState(active);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const request = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    if (surveyId == null) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    const result = await surveysApi.getSurvey(surveyId, controller.signal);
    if (controller.signal.aborted) return;
    if (result.ok) {
      setSurvey(result.data);
      setMissing(false);
    } else if (result.status === 404) {
      setMissing(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [surveyId]);

  useEffect(() => {
    if (!active) return;
    void reload();
    return () => request.current?.abort();
  }, [active, reload]);

  return { survey, loading: active && loading, error, missing, reload };
}
