"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { RequestGroup } from "@/stores/useRequestStore";
import {
  buildMobileRequestDetailPath,
  buildRequestsListPath,
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
 * Общий флоу: `?requestId=` в URL → выбор заявки → панель деталей (десктоп) или `/{role}/requests/:id` (мобилка).
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
  const currentSearch = searchParams.toString();

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
    if (!requestIdFromUrl) return null;
    if (selectedRequest && String(selectedRequest.id) === requestIdFromUrl) return selectedRequest;
    if (resolvedFromUrl && String(resolvedFromUrl.id) === requestIdFromUrl) return resolvedFromUrl;
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
        router.push(buildRequestsUrlWithId(requestsBasePath, request.id, currentSearch), {
          scroll: false,
        });
      } else {
        router.push(buildMobileRequestDetailPath(requestsBasePath, request.id, currentSearch));
      }
    },
    [isDesktop, requestsBasePath, currentSearch, router]
  );

  const openRequestById = useCallback(
    (requestId: string | number) => {
      if (isDesktop) {
        router.push(buildRequestsUrlWithId(requestsBasePath, requestId, currentSearch));
      } else {
        router.push(buildMobileRequestDetailPath(requestsBasePath, requestId, currentSearch));
      }
    },
    [isDesktop, requestsBasePath, currentSearch, router]
  );

  const closeDetail = useCallback(() => {
    setSelectedRequest(null);
    router.push(buildRequestsListPath(requestsBasePath, currentSearch), { scroll: false });
  }, [requestsBasePath, currentSearch, router]);

  const clearAfterUpdate = useCallback(() => {
    setSelectedRequest(null);
    router.push(buildRequestsListPath(requestsBasePath, currentSearch), { scroll: false });
  }, [requestsBasePath, currentSearch, router]);

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
