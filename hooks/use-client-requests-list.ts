"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildRequestsUrlWithoutFilters } from "@/lib/requestNavigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useRequestStore } from "@/stores/useRequestStore";
import type { RequestGroup, SubRequest } from "@/stores/useRequestStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";
import { getStatusOptionsForRole } from "@/constants/requests";
import { filterRequestGroups } from "@/lib/request-utils";
import api from "@/lib/api";
import { collectRequestPages, listLoadError } from "@/lib/request-list-loading";
import { useRequestListWindow } from "@/hooks/use-request-list-window";

export function useClientRequestsList() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();
  const { token, isGuest } = useAuthStore();
  const { toast } = useToast();
  const { requests, setRequests } = useRequestStore();

  const statusFilterOptions = useMemo(() => getStatusOptionsForRole("client"), []);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchVersion = useRef(0);
  const [userRatings, setUserRatings] = useState<Record<number, { rating: number; comment?: string }>>({});
  const [clientRatings, setClientRatings] = useState<Record<number, any>>({});
  const [requestToRate, setRequestToRate] = useState<SubRequest | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);

  const fetchRequests = useCallback(
    async (_page = 1) => {
      const version = ++fetchVersion.current;
      if (!token || isGuest) {
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const list = await collectRequestPages<RequestGroup>(async (page) => {
          const response = await api.get("/request-groups", { params: { page, pageSize: 50 } });
          return response.data;
        });
        if (version !== fetchVersion.current) return;
        setRequests(list);
        const ratings: Record<number, unknown> = {};
        list.forEach((group) => {
          if (group.clientRatings?.length) ratings[group.id] = group.clientRatings;
        });
        setClientRatings(ratings);
      } catch (failure) {
        if (version === fetchVersion.current) setError(listLoadError(failure));
      } finally {
        if (version === fetchVersion.current) setLoading(false);
      }
    },
    [token, isGuest, setRequests]
  );

  useEffect(() => {
    void fetchRequests();
    return () => { fetchVersion.current += 1; };
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

  const { visibleRequests, hasMore, loadingMore, handleLoadMore } = useRequestListWindow(
    filteredRequests, `${filterStatus}:${filterType}`,
  );
  const resetFilters = () => {
    setFilterStatus("all"); setFilterType("all");
    router.replace(buildRequestsUrlWithoutFilters(pathname, searchParams.toString()), { scroll: false });
  };

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
    filteredRequests: visibleRequests,
    error,
    isFiltered: filterStatus !== "all" || filterType !== "all",
    resetFilters,
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
