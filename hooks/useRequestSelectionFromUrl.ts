"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { RequestGroup } from "@/stores/useRequestStore";
import {
  buildMobileRequestDetailPath,
  buildRequestsUrlWithId,
} from "@/lib/requestNavigation";

export interface UseRequestSelectionFromUrlOptions {
  /** Базовый путь раздела заявок, напр. `/client/requests` */
  requestsBasePath: string;
  /** Списки для поиска заявки по `requestId` из URL */
  requestLists: RequestGroup[][];
  /** Доп. списки (напр. отфильтрованные) для отображения, если заявка ещё не в store */
  fallbackLists?: RequestGroup[][];
  isDesktop: boolean;
  /** Не резолвить `requestId`, пока данные не загружены */
  isDataReady?: boolean;
}

/**
 * Общий флоу: `?requestId=` в URL → выбор заявки → панель деталей (десктоп) или `/requests/:id` (мобилка).
 */
export function useRequestSelectionFromUrl({
  requestsBasePath,
  requestLists,
  fallbackLists = [],
  isDesktop,
  isDataReady = true,
}: UseRequestSelectionFromUrlOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestIdFromUrl = searchParams?.get("requestId") ?? null;

  const [selectedRequest, setSelectedRequest] = useState<RequestGroup | null>(null);
  const [resolvedFromUrl, setResolvedFromUrl] = useState<RequestGroup | null>(null);

  const findById = useCallback(
    (id: string) => {
      for (const list of requestLists) {
        const found = list.find((r) => String(r.id) === id);
        if (found) return found;
      }
      return null;
    },
    [requestLists]
  );

  useEffect(() => {
    if (!isDataReady) return;
    if (requestIdFromUrl) {
      setResolvedFromUrl(findById(requestIdFromUrl));
    } else {
      setResolvedFromUrl(null);
    }
  }, [requestIdFromUrl, findById, isDataReady]);

  const displayRequest = useMemo(() => {
    if (selectedRequest) return selectedRequest;
    if (resolvedFromUrl) return resolvedFromUrl;
    if (!requestIdFromUrl) return null;
    for (const list of fallbackLists) {
      const found = list.find((r) => String(r.id) === requestIdFromUrl);
      if (found) return found;
    }
    return null;
  }, [selectedRequest, resolvedFromUrl, requestIdFromUrl, fallbackLists]);

  const selectRequest = useCallback(
    (request: RequestGroup) => {
      if (isDesktop) {
        setSelectedRequest(request);
        router.push(buildRequestsUrlWithId(requestsBasePath, request.id), {
          scroll: false,
        });
      } else {
        router.push(buildMobileRequestDetailPath(requestsBasePath, request.id));
      }
    },
    [isDesktop, requestsBasePath, router]
  );

  const openRequestById = useCallback(
    (requestId: string | number) => {
      if (isDesktop) {
        router.push(buildRequestsUrlWithId(requestsBasePath, requestId));
      } else {
        router.push(buildMobileRequestDetailPath(requestsBasePath, requestId));
      }
    },
    [isDesktop, requestsBasePath, router]
  );

  const closeDetail = useCallback(() => {
    setSelectedRequest(null);
    router.push(requestsBasePath, { scroll: false });
  }, [requestsBasePath, router]);

  const clearAfterUpdate = useCallback(() => {
    setSelectedRequest(null);
    router.push(requestsBasePath, { scroll: false });
  }, [requestsBasePath, router]);

  return {
    requestIdFromUrl,
    selectedRequest,
    setSelectedRequest,
    displayRequest,
    selectRequest,
    openRequestById,
    closeDetail,
    clearAfterUpdate,
  };
}
