"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import { getRequestNavigationUrl } from "@/lib/requestNavigation";
import {
  NOTIFICATIONS_PAGE_SIZE,
  type AppNotification,
  type NotificationsPageResponse,
} from "@/components/notification/notification-types";

export function useNotificationsPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [notFoundRequestId, setNotFoundRequestId] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const loadNotifications = useCallback(async (pageNum: number, reset = false) => {
    if (isLoadingRef.current && !reset) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get<NotificationsPageResponse>(
        `/notifications/me?page=${pageNum}&pageSize=${NOTIFICATIONS_PAGE_SIZE}`,
      );

      setNotifications((prev) =>
        reset
          ? res.data.notifications
          : [
              ...prev,
              ...res.data.notifications.filter(
                (newNotif) => !prev.some((p) => p.id === newNotif.id),
              ),
            ],
      );

      setHasMore(pageNum < res.data.totalPages);
      if (reset) setPage(1);
      else setPage(pageNum);
    } catch (err) {
      console.error("Ошибка загрузки уведомлений:", err);
      setError("Не удалось загрузить уведомления");
      if (reset) setNotifications([]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications(1, true);
    }
  }, [user, loadNotifications]);

  const markAsRead = useCallback(async (notification: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)),
    );

    if (!notification.is_read) {
      try {
        await api.patch(`/notifications/${notification.id}/read`);
      } catch (markError) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: false } : n)),
        );
        console.error("Ошибка при пометке уведомления как прочитано", markError);
      }
    }
  }, []);

  const handleNotificationPress = useCallback(
    async (notification: AppNotification) => {
      if (!isDesktop) {
        setSelectedNotification(notification);
      }
      await markAsRead(notification);
      if (!isDesktop) {
        setSelectedNotification((prev) =>
          prev?.id === notification.id ? { ...prev, is_read: true } : prev,
        );
      }
    },
    [isDesktop, markAsRead],
  );

  const handleRequestClick = useCallback(
    (requestId: string) => {
      const url = getRequestNavigationUrl({
        role: role || user?.role || "client",
        isDesktop,
        requestId,
      });

      if (url) {
        setSelectedNotification(null);
        router.push(url);
        return;
      }

      setNotFoundRequestId(requestId);
      setShowNotFoundModal(true);
    },
    [isDesktop, role, router, user?.role],
  );

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - (scrollTop + clientHeight) < 100) {
      loadNotifications(page + 1);
    }
  }, [hasMore, isLoading, loadNotifications, page]);

  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const throttledHandleScroll = useCallback(() => {
    if (throttleRef.current) return;
    throttleRef.current = setTimeout(() => {
      handleScroll();
      throttleRef.current = null;
    }, 100);
  }, [handleScroll]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("scroll", throttledHandleScroll, { passive: true });
    return () => el.removeEventListener("scroll", throttledHandleScroll);
  }, [throttledHandleScroll]);

  const handleClose = () => router.back();
  const handleRetry = () => loadNotifications(1, true);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    user,
    isDesktop,
    notifications,
    isLoading,
    error,
    hasMore,
    unreadCount,
    containerRef,
    selectedNotification,
    setSelectedNotification,
    showNotFoundModal,
    setShowNotFoundModal,
    notFoundRequestId,
    handleNotificationPress,
    handleRequestClick,
    handleClose,
    handleRetry,
  };
}

export type UseNotificationsPageResult = ReturnType<typeof useNotificationsPage>;
