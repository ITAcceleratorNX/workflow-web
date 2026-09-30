"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api, { getOffices, type Office } from "@/lib/api";
import { getRequestNavigationUrl } from "@/lib/requestNavigation";
import type { ExecutorRequestGroupsResponse } from "@/lib/types/request";
import { useRequestStore, type RequestGroup } from "@/stores/useRequestStore";

export interface ExecutorHomeStats {
  totalRequests: number;
  overdue: number;
  inWork: number;
  completed: number;
  onTime: number;
  late: number;
  averageExecutionHours: string;
  averageRating: string;
}

export function useExecutorHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();

  const {
    assignedRequests,
    myRequests,
    completedRequests,
    setAssignedRequests,
    setMyRequests,
    setCompletedRequests,
  } = useRequestStore();

  const [stats, setStats] = useState<ExecutorHomeStats | null>(null);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [clientRatings, setClientRatings] = useState<Record<number, unknown>>({});
  const [offices, setOffices] = useState<Office[]>([]);
  const [isBookingTab, setIsBookingTab] = useState(false);

  useEffect(() => {
    const requestId = searchParams.get("requestId");
    if (requestId) {
      const url = getRequestNavigationUrl({ role: "executor", isDesktop, requestId });
      if (url) {
        router.replace(url);
        return;
      }
    }

    if (searchParams.get("createRequest") === "true") {
      router.replace("/create-request");
      return;
    }

    const tab = searchParams.get("tab");
    setIsBookingTab(isDesktop && tab === "booking");
  }, [searchParams, isDesktop, router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/analytics/stats/executor");
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchOffices = useCallback(async () => {
    try {
      const res = await getOffices();
      setOffices(res.data || []);
    } catch (error) {
      console.error("Ошибка при загрузке офисов:", error);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await api.get<ExecutorRequestGroupsResponse>("request-groups");
      // Request groups already contain aggregated ratings; an optional rating request
      // must not prevent the primary lists from loading.
      setCompletedRequests(response.data.completedRequests);
      setAssignedRequests(response.data.assignedRequests);
      setMyRequests(response.data.myRequests);

      const newRatings: Record<number, unknown> = {};
      const allGroups: RequestGroup[] = [
        ...response.data.completedRequests,
        ...response.data.assignedRequests,
        ...response.data.myRequests,
      ];
      allGroups.forEach((requestGroup) => {
        if (requestGroup.clientRatings?.length) {
          const rating = requestGroup.clientRatings[0];
          newRatings[requestGroup.id] = {
            id: rating.id,
            rating: rating.rating,
            comment: rating.comment,
            request_group_id: requestGroup.id,
            created_at: rating.created_at,
            ratedClient: rating.ratedClient,
          };
        }
      });
      setClientRatings(newRatings);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    }
  }, [setAssignedRequests, setCompletedRequests, setMyRequests]);

  const fetchMyRating = useCallback(async () => {
    try {
      const response = await api.get<{ average_rating: string | number | null }>("executors/average-rating");
      const value = response.data.average_rating;
      const rating = value === null || value === "" ? NaN : Number(value);
      setMyRating(Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : null);
    } catch (error) {
      console.error("Failed to fetch executor rating:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRequests();
    fetchOffices();
    fetchMyRating();
  }, [fetchStats, fetchRequests, fetchOffices, fetchMyRating]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchStats(), fetchRequests(), fetchOffices(), fetchMyRating()]);
  }, [fetchStats, fetchRequests, fetchOffices, fetchMyRating]);

  const handleRequestClick = useCallback(
    (requestId: number) => {
      router.push(`/executor/requests?requestId=${requestId}`);
    },
    [router]
  );

  return {
    isDesktop,
    isBookingTab,
    stats,
    myRating,
    assignedRequests,
    myRequests,
    completedRequests,
    clientRatings,
    offices,
    handleRefresh,
    handleRequestClick,
  };
}

export type UseExecutorHomeResult = ReturnType<typeof useExecutorHome>;
