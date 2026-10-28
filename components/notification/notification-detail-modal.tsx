"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatNotificationDateTime } from "@/lib/dateTimeUtils";
import type { CategoryNotification } from "@/lib/notification-categories";
import { NotificationText } from "./categories/category-visuals";

interface NotificationDetailModalProps {
  notification: CategoryNotification | null;
  onClose: () => void;
  onRequestClick: (requestId: string) => void;
}

/** Полный текст уведомления на Mobile (макет «История - полный текст (модалка)»). */
export function NotificationDetailModal({ notification, onClose, onRequestClick }: NotificationDetailModalProps) {
  return (
    <Dialog open={!!notification} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[calc(100%-32px)] max-w-[361px] gap-0 overflow-hidden rounded-[20px] border border-white/10 bg-[#1C1C1E] p-0 text-[#FAFAFA] sm:rounded-[20px] [&>button]:right-2 [&>button]:top-2 [&>button]:text-[#FAFAFA] [&>button]:data-[state=open]:bg-transparent [&>button]:data-[state=open]:text-[#FAFAFA]"
      >
        <div className="border-b border-[#27272A] py-4 pl-4 pr-10">
          <DialogTitle className="text-lg font-semibold leading-6 text-[#FAFAFA]">{notification?.title}</DialogTitle>
        </div>
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto p-4">
          <DialogDescription asChild>
            <p className="whitespace-pre-line text-sm leading-[23px] text-[#FAFAFA]">
              {notification && (
                <NotificationText notification={notification} onRequestClick={onRequestClick} linkClassName="font-semibold text-[#F35713]" />
              )}
            </p>
          </DialogDescription>
          {notification?.created_at && (
            <p className="text-xs text-[#A1A1AA]">{formatNotificationDateTime(notification.created_at)}</p>
          )}
        </div>
        <div className="border-t border-[#27272A] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-xl border border-white/15 text-sm font-medium text-[#FAFAFA] transition-colors hover:bg-white/5"
          >
            Закрыть
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
