"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import api, { getOffices, type Office } from "@/lib/api";
import type { ExecutorRequestGroupsResponse } from "@/lib/types/request";
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
  } = useRequestStore();

  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [response, officesRes] = await Promise.all([api.get<ExecutorRequestGroupsResponse>("request-groups"), getOffices()]);
      setOffices(officesRes.data || []);

      setCompletedRequests(response.data.completedRequests);
      setAssignedRequests(response.data.assignedRequests || []);
      setMyRequests(response.data.myRequests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [setAssignedRequests, setCompletedRequests, setMyRequests]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
