"use client";

import { Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getContentSegmentsWithRequestIds } from "@/lib/notificationUtils";
import { formatNotificationDateTime } from "@/lib/dateTimeUtils";
import type { AppNotification } from "./notification-types";

interface NotificationDetailModalProps {
  notification: AppNotification | null;
  onClose: () => void;
  onRequestClick: (requestId: string) => void;
}

/** Детальный просмотр уведомления — parity с RN NotificationsList modal. */
export function NotificationDetailModal({
  notification,
  onClose,
  onRequestClick,
}: NotificationDetailModalProps) {
  return (
    <Dialog open={!!notification} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-lg font-semibold leading-snug pr-6">
              {notification?.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-wrap items-start gap-x-0.5">
            {notification?.content
              ? getContentSegmentsWithRequestIds(notification.content).map((seg, idx) =>
                  seg.type === "text" ? (
                    <span key={idx} className="text-sm leading-relaxed text-foreground">
                      {seg.value}
                    </span>
                  ) : (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onRequestClick(seg.value)}
                      className="text-sm font-semibold text-[#F35713] underline underline-offset-2 hover:opacity-80"
                    >
                      № {seg.value}
                    </button>
                  ),
                )
              : null}
          </div>
          {notification?.created_at && (
            <p className="text-xs text-muted-foreground mt-4">
              {formatNotificationDateTime(notification.created_at)}
            </p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface NotificationsEmptyStateProps {
  compact?: boolean;
}

export function NotificationsEmptyState({ compact }: NotificationsEmptyStateProps) {
  return (
    <div className={`text-center ${compact ? "py-10" : "py-12"}`}>
      <div
        className={`${compact ? "w-12 h-12" : "w-16 h-16"} bg-muted rounded-full flex items-center justify-center mx-auto mb-4`}
      >
        <Bell className={`${compact ? "h-6 w-6" : "h-8 w-8"} text-muted-foreground`} />
      </div>
      <p className="text-muted-foreground font-medium">Нет уведомлений</p>
      <p className="text-sm text-muted-foreground/80 mt-1">Новые уведомления появятся здесь</p>
    </div>
  );
}
