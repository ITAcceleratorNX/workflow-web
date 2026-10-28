import api from "@/lib/api";
import type {
  CategoryNotification,
  CategorySummary,
  NotificationCategory,
} from "@/lib/notification-categories";

export const CATEGORY_HISTORY_PAGE_SIZE = 20;

export interface CategoryHistoryPage {
  notifications: CategoryNotification[];
  page: number;
  totalPages: number;
  total: number;
}

/** Категории роли со счётчиками и последним уведомлением. */
export async function fetchNotificationSummary(): Promise<CategorySummary> {
  const res = await api.get<CategorySummary>("/notifications/me/summary");
  return res.data;
}

/** Страница истории одной категории: новые первыми, как отдаёт Backend. */
export async function fetchCategoryHistory(
  category: NotificationCategory,
  page: number,
): Promise<CategoryHistoryPage> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(CATEGORY_HISTORY_PAGE_SIZE),
    category,
  });
  const res = await api.get<CategoryHistoryPage>(`/notifications/me?${params}`);
  return res.data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}
