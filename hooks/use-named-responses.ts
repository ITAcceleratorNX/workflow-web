"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { surveysApi } from "@/lib/surveys-api";
import type { NamedResponse } from "@/lib/surveys/types";

const PAGE_SIZE = 20;

/**
 * Ответы именного опроса по людям (GET /surveys/admin/:id/responses): новые сверху, страницами по
 * 20. «Показать ещё» добавляет следующую страницу; ответ, пришедший между страницами, сдвигает их —
 * повторы отбрасываются. Ошибка следующей страницы не прячет уже показанные.
 */
export function useNamedResponses(surveyId: number) {
  const [responses, setResponses] = useState<NamedResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  const loadPage = useCallback(
    async (next: number) => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);
      setError(null);
      const result = await surveysApi.getNamedResponses(surveyId, { page: next, limit: PAGE_SIZE }, controller.signal);
      if (controller.signal.aborted) return;
      if (result.ok) {
        const { responses: onPage, total: count } = result.data;
        setResponses((current) => {
          if (next === 1) return onPage;
          const shown = new Set(current.map((response) => response.id));
          return [...current, ...onPage.filter((response) => !shown.has(response.id))];
        });
        setTotal(count);
        setPage(next);
      } else {
        setError(result.error);
      }
      setLoading(false);
    },
    [surveyId],
  );

  useEffect(() => {
    void loadPage(1);
    return () => request.current?.abort();
  }, [loadPage]);

  return {
    responses,
    total,
    loading,
    error,
    hasMore: responses.length < total,
    /** «Показать ещё» и «Повторить» после ошибки: следующая страница — или первая, если не загрузилась и она. */
    loadNext: () => void loadPage(page + 1),
  };
}
