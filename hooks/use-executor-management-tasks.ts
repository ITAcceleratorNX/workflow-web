"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api from "@/lib/api";
import { listLoadError } from "@/lib/request-list-loading";
import { useRequestListWindow } from "@/hooks/use-request-list-window";
import { useRequestStore, type RequestGroup } from "@/stores/useRequestStore";
import { getStatusOptionsForRole } from "@/constants/requests";
import { filterRequestGroups, matchesRequestTypeFilter } from "@/lib/request-utils";
import {
  sortAssignedTasksByType,
  type ExecutorRequestsTab,
} from "@/components/executor/requests/executor-requests-constants";

export const EXECUTOR_MANAGEMENT_TASKS_BACK_HREF = "/executor/management";

export function useExecutorManagementTasks(tab: ExecutorRequestsTab) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const {
    assignedRequests,
    myRequests,
    completedRequests,
    setAssignedRequests,
    setCompletedRequests,
    setMyRequests,
  } = useRequestStore();

  const [filterType, setFilterType] = useState("all");
  const [filterMyStatus, setFilterMyStatus] = useState("all");
  const [filterMyType, setFilterMyType] = useState("all");
  const [clientRatings, setClientRatings] = useState<Record<number, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusFilterOptions = useMemo(() => getStatusOptionsForRole("executor"), []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("request-groups");
      setCompletedRequests(response.data.completedRequests || []);
      setAssignedRequests(response.data.assignedRequests || []);
      setMyRequests(response.data.myRequests || []);

      const newRatings: Record<number, unknown> = {};
      const allGroups: RequestGroup[] = [
        ...(response.data.completedRequests || []),
        ...(response.data.assignedRequests || []),
        ...(response.data.myRequests || []),
      ];
      allGroups.forEach((rg) => {
        if (rg.clientRatings?.length) {
          const r = rg.clientRatings[0];
          newRatings[rg.id] = { id: r.id, rating: r.rating, comment: r.comment };
        }
      });
      setClientRatings(newRatings);
    } catch (e) {
      setError(listLoadError(e));
    } finally {
      setLoading(false);
    }
  }, [setAssignedRequests, setCompletedRequests, setMyRequests]);

  useEffect(() => {
    if (isDesktop) return;
    fetchRequests();
  }, [isDesktop, fetchRequests]);

  useEffect(() => {
    if (isDesktop) {
      router.replace("/executor/requests");
    }
  }, [isDesktop, router]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await fetchRequests();
  }, [fetchRequests]);

  const handleCardClick = useCallback(
    (request: RequestGroup) => {
      router.push(`/executor/requests?requestId=${request.id}`);
    },
    [router]
  );

  const filteredList = useMemo(() => {
    if (tab === "tasks") {
      return sortAssignedTasksByType(
        (assignedRequests || []).filter((t) => matchesRequestTypeFilter(t, filterType))
      );
    }
    if (tab === "myTasks") {
      return filterRequestGroups(myRequests || [], {
        status: filterMyStatus,
        type: filterMyType,
      });
    }
    return (completedRequests || []).filter((t) => matchesRequestTypeFilter(t, filterType));
  }, [
    tab,
    assignedRequests,
    myRequests,
    completedRequests,
    filterType,
    filterMyStatus,
    filterMyType,
  ]);

  const window = useRequestListWindow(filteredList, `${tab}:${filterType}:${filterMyStatus}:${filterMyType}`);
  const isFiltered = tab === "myTasks" ? filterMyStatus !== "all" || filterMyType !== "all" : filterType !== "all";
  const resetFilters = () => { setFilterType("all"); setFilterMyStatus("all"); setFilterMyType("all"); };

  return {
    isDesktop,
    tab,
    filterType,
    setFilterType,
    filterMyStatus,
    setFilterMyStatus,
    filterMyType,
    setFilterMyType,
    statusFilterOptions,
    loading,
    clientRatings,
    filteredList: window.visibleRequests,
    hasMore: window.hasMore,
    handleLoadMore: window.handleLoadMore,
    error,
    isFiltered,
    resetFilters,
    handleRefresh,
    handleCardClick,
  };
}

export type UseExecutorManagementTasksResult = ReturnType<typeof useExecutorManagementTasks>;
