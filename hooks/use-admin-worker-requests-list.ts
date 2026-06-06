"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsDesktop } from "@/hooks/use-media-query";
import api, { deleteRecurringTask } from "@/lib/api";
import { useRequestStore } from "@/stores/useRequestStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { useRequestSelectionFromUrl } from "@/hooks/useRequestSelectionFromUrl";
import { getStatusOptionsForRole } from "@/constants/requests";
import { filterRequestGroups, sortRequestGroupsByPriority } from "@/lib/request-utils";
import type { AdminWorkerRequestsTab } from "@/components/admin-worker/requests/admin-worker-requests-constants";

export function useAdminWorkerRequestsList() {
  const isDesktop = useIsDesktop();
  const { token } = useAuthStore();
  const { toast } = useToast();
  const { incomingRequests, setIncomingRequests, myRequests, setMyRequests } = useRequestStore();

  const [filterMyStatus, setFilterMyStatus] = useState("all");
  const [filterMyType, setFilterMyType] = useState("all");
  const [filterIncomingStatus, setFilterIncomingStatus] = useState("all");
  const [filterIncomingType, setFilterIncomingType] = useState("all");
  const [activeTab, setActiveTab] = useState<AdminWorkerRequestsTab>("incoming");
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const lastElementRef = useRef<HTMLDivElement>(null);

  const statusFilterOptions = useMemo(() => getStatusOptionsForRole("admin-worker"), []);

  const fetchRequests = useCallback(
    async (currentPage = 1) => {
      if (!token) return;
      const isFirstPage = currentPage === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: "10",
        });
        if (filterIncomingStatus !== "all" && filterIncomingStatus !== "long_term") {
          params.append("status", filterIncomingStatus);
        }
        if (filterIncomingType !== "all") {
          params.append("priority", filterIncomingType);
        }

        const response = await api.get(`/request-groups?${params.toString()}`);
        const sortedIncoming = sortRequestGroupsByPriority(response.data.otherRequests || []);
        const sortedMy = sortRequestGroupsByPriority(response.data.myRequests || []);

        setIncomingRequests((prev) =>
          currentPage === 1
            ? sortedIncoming
            : [...prev, ...sortedIncoming.filter((i) => !prev.some((p) => p.id === i.id))]
        );
        setMyRequests((prev) =>
          currentPage === 1
            ? sortedMy
            : [...prev, ...sortedMy.filter((i) => !prev.some((p) => p.id === i.id))]
        );
        setHasMore(
          (response.data.otherRequests?.length || 0) + (response.data.myRequests?.length || 0) >= 10
        );
        setPage(currentPage);
      } catch (error) {
        console.error("Ошибка при загрузке заявок:", error);
      } finally {
        if (isFirstPage) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [token, filterIncomingStatus, filterIncomingType, setIncomingRequests, setMyRequests]
  );

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const filteredMyRequests = useMemo(
    () =>
      sortRequestGroupsByPriority(
        filterRequestGroups(myRequests, {
          status: filterMyStatus,
          type: filterMyType,
        })
      ),
    [myRequests, filterMyStatus, filterMyType]
  );

  const filteredIncomingRequests = useMemo(
    () =>
      sortRequestGroupsByPriority(
        filterRequestGroups(incomingRequests, {
          status: filterIncomingStatus,
          type: filterIncomingType,
        })
      ),
    [incomingRequests, filterIncomingStatus, filterIncomingType]
  );

  const activeList = useMemo(() => {
    if (activeTab === "incoming") return filteredIncomingRequests;
    if (activeTab === "my-requests") return filteredMyRequests;
    return [];
  }, [activeTab, filteredIncomingRequests, filteredMyRequests]);

  const {
    displayRequest,
    selectRequest: handleCardClick,
    closeDetail: handleClosePanel,
    clearAfterUpdate,
  } = useRequestSelectionFromUrl({
    requestsBasePath: "/admin-worker/requests",
    requestLists: [incomingRequests, myRequests],
    fallbackLists: [filteredIncomingRequests, filteredMyRequests],
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

  const handleDeleteRecurringTask = useCallback(
    async (id: number) => {
      try {
        await deleteRecurringTask(id);
        toast({ title: "Задача удалена" });
      } catch {
        toast({ title: "Ошибка", variant: "destructive" });
      }
    },
    [toast]
  );

  return {
    isDesktop,
    activeTab,
    setActiveTab,
    filterMyStatus,
    setFilterMyStatus,
    filterMyType,
    setFilterMyType,
    filterIncomingStatus,
    setFilterIncomingStatus,
    filterIncomingType,
    setFilterIncomingType,
    statusFilterOptions,
    loading,
    loadingMore,
    hasMore,
    activeList,
    filteredIncomingRequests,
    filteredMyRequests,
    handleRefresh,
    handleLoadMore,
    handleCardClick,
    displayRequest,
    handleClosePanel,
    handleRequestUpdated,
    handleDeleteRecurringTask,
    lastElementRef,
  };
}

export type UseAdminWorkerRequestsListResult = ReturnType<typeof useAdminWorkerRequestsList>;
