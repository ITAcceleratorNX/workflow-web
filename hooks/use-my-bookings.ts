"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMyBookings,
  type MeetingRoomBooking,
  type MyBookingsStatusFilter,
} from "@/lib/api";
import { MY_BOOKINGS_PAGE_SIZE } from "@/components/meeting-rooms/meeting-rooms-constants";

function normalizeBookingsResponse(res: { data: unknown }): {
  data: MeetingRoomBooking[];
  hasMore: boolean;
} {
  const raw = res.data;
  if (Array.isArray(raw)) return { data: raw, hasMore: false };
  const obj = raw as { data?: MeetingRoomBooking[]; hasMore?: boolean };
  const list = Array.isArray(obj?.data) ? obj.data : [];
  const hasMore = typeof obj?.hasMore === "boolean" ? obj.hasMore : false;
  return { data: list, hasMore };
}

async function fetchAllBookingSegments() {
  const [active, completed, cancelled] = await Promise.all([
    getMyBookings({ status: "active", page: 1, pageSize: MY_BOOKINGS_PAGE_SIZE }).then(
      normalizeBookingsResponse,
    ),
    getMyBookings({ status: "completed", page: 1, pageSize: MY_BOOKINGS_PAGE_SIZE }).then(
      normalizeBookingsResponse,
    ),
    getMyBookings({ status: "cancelled", page: 1, pageSize: MY_BOOKINGS_PAGE_SIZE }).then(
      normalizeBookingsResponse,
    ),
  ]);
  return { active, completed, cancelled };
}

export function useMyBookings() {
  const [activeList, setActiveList] = useState<MeetingRoomBooking[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [activeHasMore, setActiveHasMore] = useState(false);
  const [completedList, setCompletedList] = useState<MeetingRoomBooking[]>([]);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedHasMore, setCompletedHasMore] = useState(false);
  const [cancelledList, setCancelledList] = useState<MeetingRoomBooking[]>([]);
  const [cancelledPage, setCancelledPage] = useState(1);
  const [cancelledHasMore, setCancelledHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState<MyBookingsStatusFilter | null>(null);

  const applySegments = useCallback(
    (segments: Awaited<ReturnType<typeof fetchAllBookingSegments>>) => {
      setActiveList(segments.active.data);
      setActivePage(1);
      setActiveHasMore(segments.active.hasMore);
      setCompletedList(segments.completed.data);
      setCompletedPage(1);
      setCompletedHasMore(segments.completed.hasMore);
      setCancelledList(segments.cancelled.data);
      setCancelledPage(1);
      setCancelledHasMore(segments.cancelled.hasMore);
    },
    [],
  );

  const fetchSegment = useCallback(
    async (status: MyBookingsStatusFilter, page: number, append: boolean) => {
      const res = await getMyBookings({
        status,
        page,
        pageSize: MY_BOOKINGS_PAGE_SIZE,
      });
      const { data: list, hasMore } = normalizeBookingsResponse(res);

      if (status === "active") {
        setActiveList((prev) => (append ? [...prev, ...list] : list));
        setActivePage(page);
        setActiveHasMore(hasMore);
      } else if (status === "completed") {
        setCompletedList((prev) => (append ? [...prev, ...list] : list));
        setCompletedPage(page);
        setCompletedHasMore(hasMore);
      } else {
        setCancelledList((prev) => (append ? [...prev, ...list] : list));
        setCancelledPage(page);
        setCancelledHasMore(hasMore);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const segments = await fetchAllBookingSegments();
      applySegments(segments);
    } catch (error) {
      console.error("Ошибка при загрузке бронирований:", error);
      setActiveList([]);
      setCompletedList([]);
      setCancelledList([]);
    } finally {
      setLoading(false);
    }
  }, [applySegments]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const segments = await fetchAllBookingSegments();
        if (!cancelled) applySegments(segments);
      } catch (error) {
        console.error("Ошибка при загрузке бронирований:", error);
        if (!cancelled) {
          setActiveList([]);
          setCompletedList([]);
          setCancelledList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [applySegments]);

  const loadMore = useCallback(
    async (status: MyBookingsStatusFilter) => {
      if (status === "active" && activeHasMore) {
        setLoadingMore("active");
        await fetchSegment(status, activePage + 1, true);
        setLoadingMore(null);
      } else if (status === "completed" && completedHasMore) {
        setLoadingMore("completed");
        await fetchSegment(status, completedPage + 1, true);
        setLoadingMore(null);
      } else if (status === "cancelled" && cancelledHasMore) {
        setLoadingMore("cancelled");
        await fetchSegment(status, cancelledPage + 1, true);
        setLoadingMore(null);
      }
    },
    [
      activeHasMore,
      activePage,
      cancelledHasMore,
      cancelledPage,
      completedHasMore,
      completedPage,
      fetchSegment,
    ],
  );

  return {
    activeList,
    completedList,
    cancelledList,
    activeHasMore,
    completedHasMore,
    cancelledHasMore,
    loading,
    loadingMore,
    loadMore,
    refresh,
  };
}

export type UseMyBookingsResult = ReturnType<typeof useMyBookings>;
