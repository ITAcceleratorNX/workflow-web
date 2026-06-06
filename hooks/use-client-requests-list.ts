"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useRequestStore } from "@/stores/useRequestStore";
import type { RequestGroup, SubRequest } from "@/stores/useRequestStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";
import { getStatusOptionsForRole } from "@/constants/requests";
import { filterRequestGroups } from "@/lib/request-utils";
import api from "@/lib/api";

export function useClientRequestsList() {
  const isDesktop = useIsDesktop();
  const { token, isGuest } = useAuthStore();
  const { toast } = useToast();
  const { requests, setRequests } = useRequestStore();

  const statusFilterOptions = useMemo(() => getStatusOptionsForRole("client"), []);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userRatings, setUserRatings] = useState<Record<number, { rating: number; comment?: string }>>({});
  const [clientRatings, setClientRatings] = useState<Record<number, any>>({});
  const [requestToRate, setRequestToRate] = useState<SubRequest | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);

  const fetchRequests = useCallback(
    async (pageToLoad = 1) => {
      if (!token) return;
      const isFirstPage = pageToLoad === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);

      if (isGuest) {
        setHasMore(false);
        setPage(1);
        if (isFirstPage) setLoading(false);
        else setLoadingMore(false);
        return;
      }

      try {
        const response = await api.get(`/request-groups?page=${pageToLoad}&pageSize=10`);
        const list: RequestGroup[] = response.data?.requests ?? [];
        if (isFirstPage) {
          setRequests(list);
        } else {
          setRequests((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const toAdd = list.filter((r) => !existingIds.has(r.id));
            return [...prev, ...toAdd];
          });
        }
        (list as any[]).forEach((group: any) => {
          if (group.clientRatings?.length) {
            setClientRatings((prev) => ({ ...prev, [group.id]: group.clientRatings }));
          }
        });
        setHasMore(list.length === 10);
        setPage(pageToLoad);
      } catch (e) {
        console.error(e);
      } finally {
        if (isFirstPage) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [token, isGuest, setRequests]
  );

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const filteredRequests = useMemo(
    () =>
      filterRequestGroups(requests, {
        status: filterStatus,
        type: filterType,
      }),
    [requests, filterStatus, filterType]
  );

  const {
    displayRequest,
    selectRequest: handleCardClick,
    closeDetail: handleClosePanel,
    clearAfterUpdate,
    setSelectedRequest,
  } = useRequestSelectionFromUrl({
    requestsBasePath: "/client/requests",
    requestLists: [requests],
    fallbackLists: [filteredRequests],
    isDesktop,
    isDataReady: !loading,
  });

  const handleRequestUpdated = useCallback(() => {
    fetchRequests(1);
    clearAfterUpdate();
  }, [fetchRequests, clearAfterUpdate]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchRequests(page + 1);
    }
  }, [loadingMore, hasMore, page, fetchRequests]);

  const handleDeleteSubRequest = useCallback(
    async (subRequest: SubRequest) => {
      try {
        await api.delete(`/requests/${subRequest.id}`);
        if (displayRequest) {
          const updated = displayRequest.requests.filter((r) => r.id !== subRequest.id);
          const next = { ...displayRequest, requests: updated };
          setSelectedRequest(next);
          const updatedList = requests
            .map((r) => (r.id === displayRequest.id ? next : r))
            .filter((r) => r.requests.length > 0);
          setRequests(updatedList);
          if (updated.length === 0) {
            handleClosePanel();
          }
        }
        toast({ title: "Подзаявка удалена" });
      } catch {
        toast({ title: "Ошибка удаления", variant: "destructive" });
      }
    },
    [displayRequest, requests, setRequests, setSelectedRequest, handleClosePanel, toast]
  );

  const openRateModal = useCallback(
    (subReq: SubRequest) => {
      setRequestToRate(subReq);
      setRatingValue(userRatings[subReq.id]?.rating || 0);
      setRatingComment("");
      setShowRatingModal(true);
    },
    [userRatings]
  );

  const closeRateModal = useCallback(() => {
    setShowRatingModal(false);
    setRequestToRate(null);
    setRatingValue(0);
    setRatingComment("");
  }, []);

  const handleRateExecutor = useCallback(async () => {
    if (!requestToRate || ratingValue <= 0) return;
    try {
      await api.post("/ratings", {
        request_id: requestToRate.id,
        rating: ratingValue,
        comment: ratingComment || undefined,
      });
      setUserRatings((prev) => ({
        ...prev,
        [requestToRate.id]: { rating: ratingValue, comment: ratingComment },
      }));
      closeRateModal();
      toast({ title: "Оценка сохранена" });
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  }, [requestToRate, ratingValue, ratingComment, closeRateModal, toast]);

  return {
    isDesktop,
    statusFilterOptions,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    loading,
    loadingMore,
    hasMore,
    filteredRequests,
    clientRatings,
    fetchRequests,
    handleLoadMore,
    handleRequestUpdated,
    handleDeleteSubRequest,
    handleCardClick,
    displayRequest,
    handleClosePanel,
    openRateModal,
    showRatingModal,
    requestToRate,
    ratingValue,
    setRatingValue,
    ratingComment,
    setRatingComment,
    closeRateModal,
    handleRateExecutor,
    userRatings,
  };
}

export type UseClientRequestsListResult = ReturnType<typeof useClientRequestsList>;
