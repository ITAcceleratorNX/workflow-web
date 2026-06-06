"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api from "@/lib/api";
import type { RequestGroup } from "@/stores/useRequestStore";

export function useManagerRequestDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isDesktop = useIsDesktop();
  const [request, setRequest] = useState<RequestGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDesktop && id) {
      router.replace(`/manager/requests?requestId=${id}`);
    }
  }, [isDesktop, router, id]);

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
    router.push("/manager/requests");
  }, [router]);

  const handleRequestUpdated = useCallback(() => {
    router.push("/manager/requests");
  }, [router]);

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
