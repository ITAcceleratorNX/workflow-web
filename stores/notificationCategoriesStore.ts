import { create } from "zustand";
import {
  applyNotificationRead,
  type CategoryNotification,
  type CategorySummary,
  type NotificationCategory,
} from "@/lib/notification-categories";
import {
  fetchCategoryHistory,
  fetchNotificationSummary,
  markNotificationRead,
} from "@/lib/notifications-api";

export interface CategoryHistoryState {
  /** Как пришло с Backend: новые первыми; порядок для экрана — chronological(). */
  items: CategoryNotification[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

interface NotificationCategoriesState {
  /** Чьи данные лежат в store: при смене пользователя всё сбрасывается. */
  userId: number | string | null;
  summary: CategorySummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  histories: Partial<Record<NotificationCategory, CategoryHistoryState>>;
  bindUser: (userId: number | string | null) => void;
  loadSummary: () => Promise<void>;
  /** Первая страница категории заново (вход в категорию, повторное открытие раздела). */
  loadHistory: (category: NotificationCategory) => Promise<void>;
  /** Следующая, более ранняя страница. */
  loadOlder: (category: NotificationCategory) => Promise<void>;
  /**
   * Открытие одного уведомления. Состояние прочтения сохраняет Backend; счётчики и запись
   * меняются только после его ответа, чтобы интерфейс не показывал несохранённое прочтение.
   */
  markRead: (notification: CategoryNotification) => Promise<void>;
}

const EMPTY_HISTORY: CategoryHistoryState = { items: [], page: 0, hasMore: true, loading: false, error: null };

let summaryRequest: { userId: number | string; promise: Promise<void> } | null = null;

export const useNotificationCategoriesStore = create<NotificationCategoriesState>((set, get) => {
  const patchHistory = (category: NotificationCategory, patch: Partial<CategoryHistoryState>) =>
    set((state) => ({
      histories: {
        ...state.histories,
        [category]: { ...(state.histories[category] ?? EMPTY_HISTORY), ...patch },
      },
    }));

  const loadPage = async (category: NotificationCategory, page: number) => {
    const userId = get().userId;
    patchHistory(category, { loading: true, error: null });
    try {
      const res = await fetchCategoryHistory(category, page);
      if (get().userId !== userId) return;
      const previous = page === 1 ? [] : get().histories[category]?.items ?? [];
      const known = new Set(previous.map((n) => n.id));
      patchHistory(category, {
        items: [...previous, ...res.notifications.filter((n) => !known.has(n.id))],
        page,
        hasMore: page < res.totalPages,
        loading: false,
      });
    } catch (error) {
      console.error("Ошибка загрузки истории уведомлений:", error);
      if (get().userId !== userId) return;
      patchHistory(category, { loading: false, error: "Не удалось загрузить уведомления" });
    }
  };

  return {
    userId: null,
    summary: null,
    summaryLoading: false,
    summaryError: null,
    histories: {},

    bindUser: (userId) => {
      if (get().userId === userId) return;
      set({ userId, summary: null, summaryLoading: false, summaryError: null, histories: {} });
    },

    loadSummary: () => {
      const userId = get().userId;
      if (userId == null) return Promise.resolve();
      // Колокольчик и раздел монтируются вместе: один запрос на всех.
      if (summaryRequest?.userId === userId) return summaryRequest.promise;
      set({ summaryLoading: true, summaryError: null });
      const request = {
        userId,
        promise: fetchNotificationSummary()
          .then((summary) => {
            if (get().userId === userId) set({ summary, summaryLoading: false });
          })
          .catch((error) => {
            console.error("Ошибка загрузки категорий уведомлений:", error);
            if (get().userId === userId) set({ summaryLoading: false, summaryError: "Не удалось загрузить уведомления" });
          })
          .finally(() => {
            if (summaryRequest === request) summaryRequest = null;
          }),
      };
      summaryRequest = request;
      return request.promise;
    },

    loadHistory: (category) => loadPage(category, 1),

    loadOlder: async (category) => {
      const history = get().histories[category];
      if (!history || history.loading || !history.hasMore) return;
      await loadPage(category, history.page + 1);
    },

    markRead: async (notification) => {
      if (notification.is_read) return;
      await markNotificationRead(notification.id);
      set((state) => {
        const category = notification.category;
        const history = category ? state.histories[category] : undefined;
        return {
          summary: state.summary ? applyNotificationRead(state.summary, notification) : state.summary,
          histories:
            category && history
              ? {
                  ...state.histories,
                  [category]: {
                    ...history,
                    items: history.items.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)),
                  },
                }
              : state.histories,
        };
      });
    },
  };
});
