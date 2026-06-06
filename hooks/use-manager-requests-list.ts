"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsDesktop } from "@/hooks/use-media-query";
import api from "@/lib/api";
import { useRequestStore } from "@/stores/useRequestStore";
import type { RequestGroup } from "@/stores/useRequestStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";
import { getStatusOptionsForRole } from "@/constants/requests";
import { filterRequestGroups } from "@/lib/request-utils";
import type {
  ManagerOffice,
  ManagerRequestPeriod,
} from "@/components/manager/requests/manager-requests-constants";

export function useManagerRequestsList() {
  const isDesktop = useIsDesktop();
  const { token } = useAuthStore();
  const { requests, setRequests } = useRequestStore();

  const [offices, setOffices] = useState<ManagerOffice[]>([]);
  const [office, setOffice] = useState("all");
  const [period, setPeriod] = useState<ManagerRequestPeriod>("month");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  const statusFilterOptions = useMemo(() => getStatusOptionsForRole("manager"), []);

  const fetchRequests = useCallback(
    async (pageToLoad = 1) => {
      if (!token) return;
      const isFirstPage = pageToLoad === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams({
          page: pageToLoad.toString(),
          pageSize: "10",
        });
        if (filterStatus !== "all" && filterStatus !== "long_term") {
          params.append("status", filterStatus);
        }
        if (filterType !== "all") {
          params.append("priority", filterType);
        }

        const response = await api.get(`/request-groups?${params.toString()}`);
        const newRequests = response.data.data || [];
        const totalPages = response.data.totalPages ?? 1;

        if (isFirstPage) {
          setRequests(newRequests);
        } else {
          setRequests((prev) => [
            ...prev,
            ...newRequests.filter((r: RequestGroup) => !prev.some((p) => p.id === r.id)),
          ]);
        }
        setHasMore(pageToLoad < totalPages);
        setPage(pageToLoad);
      } catch (error) {
        console.error("Ошибка при загрузке заявок:", error);
      } finally {
        if (isFirstPage) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [token, filterStatus, filterType, setRequests]
  );

  const fetchOffices = useCallback(async () => {
    try {
      const response = await api.get<ManagerOffice[]>("/offices");
      setOffices(response.data || []);
    } catch (err) {
      console.error("Ошибка загрузки офисов:", err);
    }
  }, []);

  useEffect(() => {
    fetchRequests(1);
    fetchOffices();
  }, [fetchRequests, fetchOffices]);

  const filteredRequests = useMemo(
    () =>
      filterRequestGroups(requests, {
        status: filterStatus,
        type: filterType,
        officeId: office,
        period,
      }),
    [requests, filterStatus, filterType, office, period]
  );

  const {
    displayRequest,
    selectRequest: handleCardClick,
    closeDetail: handleClosePanel,
    clearAfterUpdate,
  } = useRequestSelectionFromUrl({
    requestsBasePath: "/manager/requests",
    requestLists: [requests],
    fallbackLists: [filteredRequests],
    isDesktop,
    isDataReady: !loading,
  });

  const handleRefresh = useCallback(async () => {
    await fetchRequests(1);
  }, [fetchRequests]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchRequests(page + 1);
    }
  }, [loadingMore, hasMore, page, fetchRequests]);

  const handleRequestUpdated = useCallback(() => {
    fetchRequests(1);
    clearAfterUpdate();
  }, [fetchRequests, clearAfterUpdate]);

  return {
    isDesktop,
    offices,
    office,
    setOffice,
    period,
    setPeriod,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    statusFilterOptions,
    loading,
    loadingMore,
    hasMore,
    filteredRequests,
    handleRefresh,
    handleLoadMore,
    handleCardClick,
    displayRequest,
    handleClosePanel,
    handleRequestUpdated,
    lastElementRef,
  };
}

export type UseManagerRequestsListResult = ReturnType<typeof useManagerRequestsList>;
