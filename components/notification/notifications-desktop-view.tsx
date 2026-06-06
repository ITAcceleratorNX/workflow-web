"use client";

import { type RefObject } from "react";
import { Bell, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestNotFoundModal } from "@/components/RequestNotFoundModal";
import { createClickableRequestIds } from "@/lib/notificationUtils";
import { formatTimeAgo } from "@/lib/dateTimeUtils";
import type { UseNotificationsPageResult } from "@/hooks/use-notifications-page";
import { NotificationsEmptyState } from "./notification-detail-modal";
import type { AppNotification } from "./notification-types";

function getNotificationIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("принята") || lower.includes("одобрена")) {
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  }
  if (lower.includes("завершена") || lower.includes("выполнена")) {
    return <CheckCircle className="w-4 h-4 text-blue-600" />;
  }
  if (lower.includes("просрочена") || lower.includes("отклонена")) {
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  }
  return <Clock className="w-4 h-4 text-gray-600" />;
}

function getNotificationBgColor(title: string, isRead: boolean) {
  if (isRead) {
    return "bg-gradient-to-r from-[#F3F3F3] to-[#C4C4CE]/30 border-[#C4C4CE] backdrop-blur-sm";
  }
  const lower = title.toLowerCase();
  if (lower.includes("принята") || lower.includes("одобрена")) {
    return "bg-gradient-to-r from-[#114A65]/20 via-[#114A65]/10 to-[#114A65]/20 border-[#114A65]/30 backdrop-blur-md";
  }
  if (lower.includes("завершена") || lower.includes("выполнена")) {
    return "bg-gradient-to-r from-[#114A65]/20 via-[#B8400E]/10 to-[#114A65]/20 border-[#114A65]/30 backdrop-blur-md";
  }
  if (lower.includes("просрочена") || lower.includes("отклонена")) {
    return "bg-gradient-to-r from-[#B8400E]/20 via-[#B8400E]/10 to-[#B8400E]/20 border-[#B8400E]/30 backdrop-blur-md";
  }
  return "bg-gradient-to-r from-[#114A65]/15 via-[#B8400E]/10 to-[#114A65]/15 border-[#114A65]/30 backdrop-blur-md";
}

function NotificationsDesktopList({
  notifications,
  isLoading,
  hasMore,
  onNotificationPress,
  onRequestClick,
}: {
  notifications: AppNotification[];
  isLoading: boolean;
  hasMore: boolean;
  onNotificationPress: (notification: AppNotification) => void;
  onRequestClick: (requestId: string) => void;
}) {
  if (notifications.length === 0 && !isLoading) {
    return <NotificationsEmptyState />;
  }

  return (
    <>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => onNotificationPress(notification)}
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${getNotificationBgColor(notification.title, notification.is_read)} ${
            notification.is_read ? "opacity-75" : "opacity-100"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.title)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                  {notification.title}
                </h3>
                {!notification.is_read && (
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium text-[#B8400E] bg-[#B8400E]/20 rounded-full whitespace-nowrap">
                    Новое
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(notification.created_at)}
              </p>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed line-clamp-3">
                {createClickableRequestIds(notification.content, onRequestClick)}
              </p>
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Загрузка...</span>
          </div>
        </div>
      )}

      {!hasMore && notifications.length > 0 && !isLoading && (
        <div className="text-center py-4">
          <div className="w-8 h-px bg-gray-200 mx-auto mb-3" />
          <p className="text-xs text-gray-400">Вы достигли конца списка</p>
        </div>
      )}
    </>
  );
}

function NotificationsDesktopModal({
  unreadCount,
  onClose,
  scrollRef,
  children,
}: {
  unreadCount: number;
  onClose: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-gray-200">
        <div className="flex items-center border-b border-[#C4C4CE] px-6 py-4 bg-[#F3F3F3]">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-[#114A65] rounded-xl flex items-center justify-center shadow-sm">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Уведомления</h2>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} новых` : "Все прочитаны"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-100"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            <span className="text-2xl text-gray-500">×</span>
          </Button>
        </div>

        <div
          ref={scrollRef}
          className="max-h-[60vh] sm:max-h-[65vh] overflow-y-auto custom-scrollbar"
        >
          <div className="px-4 py-4 space-y-3">{children}</div>
        </div>

        <div className="border-t border-gray-100 px-6 py-3 bg-gray-50/50">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
}

type NotificationsDesktopViewProps = Pick<
  UseNotificationsPageResult,
  | "notifications"
  | "isLoading"
  | "hasMore"
  | "unreadCount"
  | "containerRef"
  | "showNotFoundModal"
  | "setShowNotFoundModal"
  | "notFoundRequestId"
  | "handleNotificationPress"
  | "handleRequestClick"
  | "handleClose"
>;

export function NotificationsDesktopView({
  notifications,
  isLoading,
  hasMore,
  unreadCount,
  containerRef,
  showNotFoundModal,
  setShowNotFoundModal,
  notFoundRequestId,
  handleNotificationPress,
  handleRequestClick,
  handleClose,
}: NotificationsDesktopViewProps) {
  return (
    <>
      <NotificationsDesktopModal
        unreadCount={unreadCount}
        onClose={handleClose}
        scrollRef={containerRef}
      >
        <NotificationsDesktopList
          notifications={notifications}
          isLoading={isLoading}
          hasMore={hasMore}
          onNotificationPress={handleNotificationPress}
          onRequestClick={handleRequestClick}
        />
      </NotificationsDesktopModal>

      <RequestNotFoundModal
        isOpen={showNotFoundModal}
        onClose={() => setShowNotFoundModal(false)}
        requestId={notFoundRequestId}
      />
    </>
  );
}
