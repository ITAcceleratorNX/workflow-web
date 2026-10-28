"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useNotificationSummary } from "@/hooks/use-notification-summary";
import { getRequestNavigationUrl } from "@/lib/requestNavigation";
import { useNotificationCategoriesStore } from "@/stores/notificationCategoriesStore";
import {
  defaultCategory,
  type CategoryNotification,
  type NotificationCategory,
} from "@/lib/notification-categories";

const NOTIFICATIONS_PATH = "/notifications";

/**
 * Раздел «Уведомления»: категории роли и история выбранной. Категория — в адресе
 * (/notifications?category=…), поэтому «Назад» и обновление страницы её сохраняют.
 * Вход в категорию ничего не читает; прочитанным становится только открытое уведомление.
 */
export function useNotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  const { summary, unreadCount, summaryLoading, summaryError, reload } = useNotificationSummary();
  const histories = useNotificationCategoriesStore((s) => s.histories);
  const loadHistory = useNotificationCategoriesStore((s) => s.loadHistory);
  const loadOlderInStore = useNotificationCategoriesStore((s) => s.loadOlder);
  const markRead = useNotificationCategoriesStore((s) => s.markRead);

  const categories = useMemo(() => summary?.categories ?? [], [summary]);
  const requested = searchParams.get("category");
  // Только категории роли: чужую категорию из адреса не открываем.
  const requestedCategory = categories.find((c) => c.category === requested)?.category ?? null;
  const activeCategory: NotificationCategory | null = isDesktop
    ? requestedCategory ?? defaultCategory(categories)
    : requestedCategory;
  const activeSummary = categories.find((c) => c.category === activeCategory) ?? null;
  const history = activeCategory ? histories[activeCategory] : undefined;

  const [selectedNotification, setSelectedNotification] = useState<CategoryNotification | null>(null);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [notFoundRequestId, setNotFoundRequestId] = useState("");

  useEffect(() => {
    if (activeCategory) void loadHistory(activeCategory);
  }, [activeCategory, loadHistory]);

  const loadOlder = useCallback(() => {
    if (activeCategory) void loadOlderInStore(activeCategory);
  }, [activeCategory, loadOlderInStore]);

  const selectCategory = useCallback(
    (category: NotificationCategory) => {
      const url = `${NOTIFICATIONS_PATH}?category=${category}`;
      if (isDesktop) router.replace(url, { scroll: false });
      else router.push(url);
    },
    [isDesktop, router],
  );

  const backToCategories = useCallback(() => {
    void reload();
    router.replace(NOTIFICATIONS_PATH);
  }, [reload, router]);

  const readNotification = useCallback(
    async (notification: CategoryNotification) => {
      try {
        await markRead(notification);
      } catch (error) {
        console.error("Ошибка при пометке уведомления как прочитано", error);
      }
    },
    [markRead],
  );

  /** Mobile: полный текст в модальном окне; Desktop: раскрытие записи в ленте. */
  const openNotification = useCallback(
    (notification: CategoryNotification) => {
      if (!isDesktop) setSelectedNotification(notification);
      void readNotification(notification);
    },
    [isDesktop, readNotification],
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

  const retry = useCallback(() => {
    void reload();
    if (activeCategory) void loadHistory(activeCategory);
  }, [activeCategory, loadHistory, reload]);

  return {
    user,
    isDesktop,
    categories,
    unreadCount,
    summaryLoading,
    summaryError,
    activeCategory,
    activeSummary,
    history,
    loadOlder,
    selectCategory,
    backToCategories,
    openNotification,
    readNotification,
    selectedNotification,
    setSelectedNotification,
    showNotFoundModal,
    setShowNotFoundModal,
    notFoundRequestId,
    handleRequestClick,
    handleClose: () => router.back(),
    retry,
  };
}

export type UseNotificationsPageResult = ReturnType<typeof useNotificationsPage>;
