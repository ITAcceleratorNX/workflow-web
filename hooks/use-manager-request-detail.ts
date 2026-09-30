"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { buildRequestsListPath, buildRequestsUrlWithId } from "@/lib/requestNavigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api from "@/lib/api";
import type { RequestGroup } from "@/stores/useRequestStore";

export function useManagerRequestDetail() {
  const router = useRouter();
  const params = useParams();
  const currentSearch = useSearchParams().toString();
  const id = params?.id as string;
  const isDesktop = useIsDesktop();
  const [request, setRequest] = useState<RequestGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDesktop && id) {
      router.replace(buildRequestsUrlWithId("/manager/requests", id, currentSearch));
    }
  }, [isDesktop, router, id, currentSearch]);

  useEffect(() => {
    if (!id || isDesktop) return;

    const fetchRequest = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/request-groups/${id}`);
        setRequest(response.data);
      } catch (err) {
        console.error("Ошибка загрузки заявки:", err);
        setError("Не удалось загрузить заявку");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, isDesktop]);

  const handleClose = useCallback(() => {
    router.push(buildRequestsListPath("/manager/requests", currentSearch));
  }, [router, currentSearch]);

  const handleRequestUpdated = useCallback(() => {
    router.push(buildRequestsListPath("/manager/requests", currentSearch));
  }, [router, currentSearch]);

  return {
    isDesktop,
    request,
    loading,
    error,
    handleClose,
    handleRequestUpdated,
  };
}

export type UseManagerRequestDetailResult = ReturnType<typeof useManagerRequestDetail>;
