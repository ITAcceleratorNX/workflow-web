"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { buildRequestsListPath, buildRequestsUrlWithId } from "@/lib/requestNavigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api from "@/lib/api";
import type { RequestGroup, SubRequest } from "@/stores/useRequestStore";
import { useRequestStore } from "@/stores/useRequestStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/hooks/use-toast";

export function useClientRequestDetail() {
  const router = useRouter();
  const params = useParams();
  const currentSearch = useSearchParams().toString();
  const id = params?.id as string;
  const isDesktop = useIsDesktop();
  const [request, setRequest] = useState<RequestGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requests = useRequestStore((s) => s.requests);
  const removeRequest = useRequestStore((s) => s.removeRequest);
  const isGuest = useAuthStore((s) => s.isGuest);
  const { toast } = useToast();

  useEffect(() => {
    if (isDesktop && id) {
      router.replace(buildRequestsUrlWithId("/client/requests", id, currentSearch));
    }
  }, [isDesktop, router, id, currentSearch]);

  useEffect(() => {
    if (!id || isDesktop) return;

    const numId = parseInt(id, 10);
    if (numId < 0) {
      const found = requests.find((r) => r.id === numId);
      setRequest(found ?? null);
      setError(found ? null : "Заявка не найдена");
      setLoading(false);
      return;
    }

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
  }, [id, isDesktop, requests]);

  const getBackUrl = useCallback(() => buildRequestsListPath("/client/requests", currentSearch), [currentSearch]);

  const handleClose = useCallback(() => {
    router.push(getBackUrl());
  }, [router, getBackUrl]);

  const handleRequestUpdated = useCallback(() => {
    router.push(getBackUrl());
  }, [router, getBackUrl]);

  const handleDelete = useCallback(
    async (subRequest: SubRequest) => {
      if (isGuest && request) {
        removeRequest(request.id);
        router.push(getBackUrl());
        return;
      }
      try {
        await api.delete(`/requests/${subRequest.id}`);
        toast({ title: "Подзаявка удалена" });
        router.push(getBackUrl());
      } catch {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить подзаявку",
          variant: "destructive",
        });
      }
    },
    [isGuest, request, removeRequest, router, getBackUrl, toast]
  );

  return {
    isDesktop,
    request,
    loading,
    error,
    handleClose,
    handleRequestUpdated,
    handleDelete,
  };
}

export type UseClientRequestDetailResult = ReturnType<typeof useClientRequestDetail>;
