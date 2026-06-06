"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api, { getOffices, type Office } from "@/lib/api";
import { getRequestNavigationUrl } from "@/lib/requestNavigation";
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
      const response = await api.get("request-groups");
      const responseRating = await api.get("ratings/executor");
      const responseMyRating = await api.get("executors/average-rating");
      setMyRating(responseMyRating.data.average_rating);

      const ratingsMap = new Map<number, { rating: number; comments: string[] }>();
      for (const r of responseRating.data) {
        ratingsMap.set(r.request_id, {
          rating: parseFloat(r.rating),
          comments: r.comments || [],
        });
      }

      const completed = response.data.completedRequests.map((reqGroup: RequestGroup) => ({
        ...reqGroup,
        requests: reqGroup.requests.map((req) => {
          const ratingData = ratingsMap.get(req.id);
          return {
            ...req,
            rating: ratingData?.rating ?? null,
            ratings: ratingData
              ? [{ rating: ratingData.rating, comments: ratingData.comments }]
              : undefined,
          };
        }),
      }));

      setCompletedRequests(completed);
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

  useEffect(() => {
    fetchStats();
    fetchRequests();
    fetchOffices();
  }, [fetchStats, fetchRequests, fetchOffices]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchStats(), fetchRequests(), fetchOffices()]);
  }, [fetchStats, fetchRequests, fetchOffices]);

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
