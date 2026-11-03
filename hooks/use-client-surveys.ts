"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { surveysApi } from "@/lib/surveys-api";
import { hasAvailableSurveys } from "@/lib/surveys/list";
import type { ClientSurvey } from "@/lib/surveys/types";

/**
 * Опросы клиента (GET /surveys): доступные — новые сверху, затем пройденные. `enabled: false` —
 * гостю опросы не положены: ничего не запрашивается. Новая загрузка отменяет прежнюю.
 */
export function useClientSurveys({ enabled = true }: { enabled?: boolean } = {}) {
  const [surveys, setSurveys] = useState<ClientSurvey[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    const result = await surveysApi.listSurveys(controller.signal);
    if (controller.signal.aborted) return;
    if (result.ok) setSurveys(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void reload();
    return () => request.current?.abort();
  }, [enabled, reload]);

  return { surveys, loading: enabled && loading, error, reload, hasAvailable: hasAvailableSurveys(surveys) };
}

export type UseClientSurveysResult = ReturnType<typeof useClientSurveys>;
