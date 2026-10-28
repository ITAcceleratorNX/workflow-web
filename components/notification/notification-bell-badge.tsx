"use client";

import { useNotificationSummary } from "@/hooks/use-notification-summary";
import { formatBadgeCount } from "@/lib/notification-categories";

/** Общий счётчик непрочитанных у иконки-колокольчика (родитель — `relative`). */
export function NotificationBellBadge() {
  const { unreadCount } = useNotificationSummary();
  if (unreadCount <= 0) return null;
  return (
    <span
      className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E85D2B] px-1 text-[11px] font-bold leading-none text-white"
      aria-label={`Непрочитанных уведомлений: ${unreadCount}`}
    >
      {formatBadgeCount(unreadCount)}
    </span>
  );
}
