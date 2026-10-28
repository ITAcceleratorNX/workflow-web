"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationCategoriesStore } from "@/stores/notificationCategoriesStore";

/**
 * Сводка категорий уведомлений текущего пользователя (общий store: колокольчик, поповер и
 * раздел «Уведомления» показывают одни и те же счётчики). При монтировании запрашивает свежую
 * сводку, чтобы повторное открытие раздела и обновление страницы брали состояние из Backend.
 */
export function useNotificationSummary({ refresh = true }: { refresh?: boolean } = {}) {
  const userId = useAuthStore((s) => (s.isGuest ? null : s.user?.id ?? null));
  const bindUser = useNotificationCategoriesStore((s) => s.bindUser);
  const loadSummary = useNotificationCategoriesStore((s) => s.loadSummary);
  const summary = useNotificationCategoriesStore((s) => s.summary);
  const summaryLoading = useNotificationCategoriesStore((s) => s.summaryLoading);
  const summaryError = useNotificationCategoriesStore((s) => s.summaryError);

  useEffect(() => {
    bindUser(userId);
    if (userId != null && refresh) void loadSummary();
  }, [userId, refresh, bindUser, loadSummary]);

  return {
    summary,
    unreadCount: summary?.unread_count ?? 0,
    summaryLoading: summaryLoading || (userId != null && !summary && !summaryError),
    summaryError,
    reload: loadSummary,
  };
}
