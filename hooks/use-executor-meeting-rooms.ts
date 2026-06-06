"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api, { getOffices, type Office } from "@/lib/api";
import { useRequestStore, type RequestGroup } from "@/stores/useRequestStore";

export function useExecutorMeetingRooms() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const {
    myRequests,
    assignedRequests,
    completedRequests,
    setAssignedRequests,
    setCompletedRequests,
    setMyRequests,
    clearRequests,
  } = useRequestStore();

  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [response, officesRes] = await Promise.all([api.get("request-groups"), getOffices()]);
      setOffices(officesRes.data || []);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [setAssignedRequests, setCompletedRequests, setMyRequests]);

  useEffect(() => {
    clearRequests();
    fetchData();
  }, [fetchData, clearRequests]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  const handleRequestClick = useCallback(
    (request: RequestGroup) => {
      router.push(`/executor/requests?requestId=${request.id}`);
    },
    [router]
  );

  return {
    isDesktop,
    offices,
    myRequests: myRequests || [],
    assignedRequests: assignedRequests || [],
    completedRequests: completedRequests || [],
    loading,
    handleRefresh,
    handleRequestClick,
  };
}

export type UseExecutorMeetingRoomsResult = ReturnType<typeof useExecutorMeetingRooms>;
