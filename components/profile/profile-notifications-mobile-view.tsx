"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NotificationsSidebar } from "@/components/notification/NotificationsSidebar";
import { createClickableRequestIds } from "@/lib/notificationUtils";
import { formatNotificationDateTime } from "@/lib/dateTimeUtils";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useProfilePage } from "@/hooks/use-profile-page";

/** Mobile notification settings + list — из legacy /profile notifications tab. */
export function ProfileNotificationsMobileView() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const profile = useProfilePage();
  const {
    user,
    isSavingNotifications,
    notificationError,
    updateUser,
    handleSaveNotifications,
    handleNotificationClick,
    handleRequestClick,
    loadMoreNotifications,
    notifPage,
    notifTotalPages,
    notifLoadingMore,
    selectedNotification,
    setSelectedNotification,
  } = profile;

  if (!user) return null;

  const labelClass = "text-[15px] font-medium text-white";

  return (
    <div
      className="min-h-screen bg-[#040404]"
      style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-11 min-h-11 flex items-center justify-center text-white"
          aria-label="Назад"
        >
          <ArrowLeft className="h-[22px] w-[22px]" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold text-white">Уведомления</h1>
        <div className="w-[26px]" />
      </div>

      <div className="mx-auto w-full max-w-[420px] px-5 space-y-6">
        <div className="rounded-xl border border-[#212121] p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Настройки уведомлений</h2>
          {(
            [
              ["email_notifications", "Email уведомления"],
              ["security_notifications", "Безопасность"],
              ["marketing_notifications", "Маркетинг"],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg px-4 py-3 border border-[#212121]"
            >
              <Label className={labelClass}>{label}</Label>
              <Switch
                checked={user[key] ?? false}
                onCheckedChange={(checked) =>
                  updateUser((prev) => (prev ? { ...prev, [key]: checked } : null))
                }
                className="data-[state=unchecked]:bg-[#212121] [&>span]:bg-white data-[state=checked]:bg-[#F35713]"
              />
            </div>
          ))}
          <Button
            onClick={handleSaveNotifications}
            disabled={isSavingNotifications}
            className="w-full h-12 rounded-lg bg-[#F35713]"
          >
            {isSavingNotifications ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSavingNotifications ? "Сохранение..." : "Сохранить"}
          </Button>
          {notificationError && <p className="text-sm text-[#F35713]">{notificationError}</p>}
        </div>

        <div className="rounded-xl border border-[#212121] p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Все уведомления</h2>
          <NotificationsSidebar
            variant="dark"
            onNotificationClick={handleNotificationClick}
            onRequestClick={(requestId) => handleRequestClick(requestId, isDesktop)}
            limit={0}
            hasMore={notifPage < notifTotalPages}
            loadingMore={notifLoadingMore}
            onLoadMore={loadMoreNotifications}
          />
        </div>
      </div>

      {selectedNotification && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="rounded-xl shadow-lg max-w-md w-full p-6 border border-[#212121] bg-[#040404]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">{selectedNotification.title}</h2>
              <button
                type="button"
                className="text-[#7F7F7F] hover:text-white text-2xl"
                onClick={() => setSelectedNotification(null)}
              >
                ×
              </button>
            </div>
            <div className="text-sm whitespace-pre-line text-[#C4C4CE]">
              {createClickableRequestIds(selectedNotification.content, (requestId) => {
                handleRequestClick(requestId, isDesktop);
              })}
            </div>
            <p className="text-xs mt-4 text-[#7F7F7F]">
              {formatNotificationDateTime(selectedNotification.created_at)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
