"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/lib/dateTimeUtils";
import { NotificationsEmptyState } from "./notification-detail-modal";
import type { AppNotification } from "./notification-types";

interface NotificationsListMobileProps {
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onNotificationPress: (notification: AppNotification) => void;
  onRetry: () => void;
}

/** Список уведомлений — parity с workflow-mobile NotificationsList. */
export function NotificationsListMobile({
  notifications,
  isLoading,
  error,
  hasMore,
  onNotificationPress,
  onRetry,
}: NotificationsListMobileProps) {
  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#F35713]" />
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 px-4">
        <p className="text-sm text-[#F35713] text-center">{error}</p>
        <Button variant="outline" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return <NotificationsEmptyState />;
  }

  return (
    <>
      {notifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          onClick={() => onNotificationPress(notification)}
          className={`w-full text-left px-[18px] py-3.5 rounded-[14px] mb-3 flex items-center gap-3 transition-opacity active:opacity-90 ${
            !notification.is_read ? "bg-[#F35713]/13" : "bg-transparent"
          }`}
        >
          <div className="shrink-0 w-[46px] h-[46px] rounded-full bg-[#F35713]/20 flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F35713"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
              {notification.title}
            </p>
            <p className="text-[13px] text-muted-foreground line-clamp-2 leading-[18px] mt-0.5">
              {notification.content}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-end justify-between gap-2 ml-2 self-stretch py-0.5">
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {formatTimeAgo(notification.created_at)}
            </span>
            {!notification.is_read && (
              <span className="w-2 h-2 rounded-full bg-[#F35713]" />
            )}
          </div>
        </button>
      ))}

      {isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasMore && !isLoading && notifications.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          Вы достигли конца списка
        </p>
      )}
    </>
  );
}
