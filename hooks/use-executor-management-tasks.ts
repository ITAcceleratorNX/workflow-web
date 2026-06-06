"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api from "@/lib/api";
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
    clearRequests,
  } = useRequestStore();

  const [filterType, setFilterType] = useState("all");
  const [filterMyStatus, setFilterMyStatus] = useState("all");
  const [filterMyType, setFilterMyType] = useState("all");
  const [clientRatings, setClientRatings] = useState<Record<number, unknown>>({});
  const [loading, setLoading] = useState(true);

  const statusFilterOptions = useMemo(() => getStatusOptionsForRole("executor"), []);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await api.get("request-groups");
      const responseRating = await api.get("ratings/executor");
      const ratingsMap = new Map<number, { rating: number; comments: string[] }>();

      for (const r of responseRating.data) {
        ratingsMap.set(r.request_id, {
          rating: parseFloat(r.rating),
          comments: r.comments || [],
        });
      }

      const mapCompleted = (list: RequestGroup[]) =>
        list?.map((reqGroup) => ({
          ...reqGroup,
          requests: reqGroup.requests?.map((req) => {
            const ratingData = ratingsMap.get(req.id);
            return {
              ...req,
              rating: ratingData?.rating ?? null,
              ratings: ratingData
                ? [{ rating: ratingData.rating, comments: ratingData.comments }]
                : undefined,
            };
          }),
        })) ?? [];

      setCompletedRequests(mapCompleted(response.data.completedRequests || []));
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [setAssignedRequests, setCompletedRequests, setMyRequests]);

  useEffect(() => {
    if (isDesktop) return;
    clearRequests();
    fetchRequests();
  }, [isDesktop, fetchRequests, clearRequests]);

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
    filteredList,
    handleRefresh,
    handleCardClick,
  };
}

export type UseExecutorManagementTasksResult = ReturnType<typeof useExecutorManagementTasks>;
