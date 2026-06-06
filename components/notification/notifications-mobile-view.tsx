"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestNotFoundModal } from "@/components/RequestNotFoundModal";
import { NotificationDetailModal } from "./notification-detail-modal";
import { NotificationsListMobile } from "./notifications-list-mobile";
import type { UseNotificationsPageResult } from "@/hooks/use-notifications-page";

type NotificationsMobileViewProps = Pick<
  UseNotificationsPageResult,
  | "notifications"
  | "isLoading"
  | "error"
  | "hasMore"
  | "containerRef"
  | "selectedNotification"
  | "setSelectedNotification"
  | "showNotFoundModal"
  | "setShowNotFoundModal"
  | "notFoundRequestId"
  | "handleNotificationPress"
  | "handleRequestClick"
  | "handleClose"
  | "handleRetry"
>;

/** Mobile notifications — parity с workflow-mobile app/notifications.tsx. */
export function NotificationsMobileView({
  notifications,
  isLoading,
  error,
  hasMore,
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
}: NotificationsMobileViewProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top">
      <div className="flex items-center px-4 pb-2 pt-2">
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 shrink-0"
          onClick={handleClose}
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-center text-xl font-semibold pr-11">Уведомления</h1>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 pt-2 pb-6 safe-area-bottom"
        style={{ minHeight: 0 }}
      >
        <NotificationsListMobile
          notifications={notifications}
          isLoading={isLoading}
          error={error}
          hasMore={hasMore}
          onNotificationPress={handleNotificationPress}
          onRetry={handleRetry}
        />
      </div>

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onRequestClick={handleRequestClick}
      />

      <RequestNotFoundModal
        isOpen={showNotFoundModal}
        onClose={() => setShowNotFoundModal(false)}
        requestId={notFoundRequestId}
      />
    </div>
  );
}
