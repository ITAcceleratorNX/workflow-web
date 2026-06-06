export const NOTIFICATIONS_PAGE_SIZE = 10;

export interface AppNotification {
  id: string | number;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
  user_id?: string | number;
}

export interface NotificationsPageResponse {
  notifications: AppNotification[];
  totalPages: number;
}
