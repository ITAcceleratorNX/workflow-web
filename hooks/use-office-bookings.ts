"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getOfficeBookings,
  type MeetingRoomBooking,
  type MyBookingsStatusFilter,
} from "@/lib/api";
import { MY_BOOKINGS_PAGE_SIZE } from "@/components/meeting-rooms/meeting-rooms-constants";

/** Бронирования офисов для Администратора / Офис-менеджера: один статус за раз, с пагинацией. */
export function useOfficeBookings(status: MyBookingsStatusFilter, officeId: number | null) {
  const [list, setList] = useState<MeetingRoomBooking[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  // Ответ на устаревший фильтр (быстрое переключение вкладок) не должен перезаписать список.
  const requestSeq = useRef(0);

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      const seq = ++requestSeq.current;
      const res = await getOfficeBookings({
        status,
        officeId,
        page: nextPage,
        pageSize: MY_BOOKINGS_PAGE_SIZE,
      });
      if (seq !== requestSeq.current) return;
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setList((prev) => (append ? [...prev, ...data] : data));
      setPage(nextPage);
      setTotal(typeof res.data?.total === "number" ? res.data.total : data.length);
      setHasMore(Boolean(res.data?.hasMore));
      setError(false);
    },
    [officeId, status],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await fetchPage(1, false);
    } catch (err) {
      console.error("Ошибка при загрузке бронирований офиса:", err);
      setList([]);
      setTotal(0);
      setHasMore(false);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(page + 1, true);
    } catch (err) {
      console.error("Ошибка при загрузке бронирований офиса:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadingMore, page]);

  return { list, total, hasMore, loading, loadingMore, error, loadMore, refresh };
}
