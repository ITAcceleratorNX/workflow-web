"use client";

import { Bell } from "lucide-react";
import { ClientDesktopShell } from "@/components/layout/ClientDesktopShell";
import { ExecutorDesktopShell } from "@/components/layout/ExecutorDesktopShell";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";
import { DesktopContentPage } from "@/components/layout/desktop-content-page";
import type { UseNotificationsPageResult } from "@/hooks/use-notifications-page";
import { NotificationsDesktopList } from "./notifications-desktop-view";

type NotificationsPageDesktopViewProps = Pick<
  UseNotificationsPageResult,
  | "notifications"
  | "isLoading"
  | "hasMore"
  | "unreadCount"
  | "containerRef"
  | "handleNotificationPress"
  | "handleRequestClick"
  | "user"
>;

function wrapWithShell(role: string | undefined, children: React.ReactNode) {
  switch (role) {
    case "client":
      return <ClientDesktopShell>{children}</ClientDesktopShell>;
    case "executor":
      return <ExecutorDesktopShell>{children}</ExecutorDesktopShell>;
    case "admin-worker":
      return <RoleDesktopShell role="admin-worker">{children}</RoleDesktopShell>;
    case "manager":
      return <RoleDesktopShell role="manager">{children}</RoleDesktopShell>;
    case "department-head":
      return <RoleDesktopShell role="department-head">{children}</RoleDesktopShell>;
    default:
      return children;
  }
}

/** Full-page notifications on desktop (/notifications route). */
export function NotificationsPageDesktopView({
  notifications,
  isLoading,
  hasMore,
  unreadCount,
  containerRef,
  handleNotificationPress,
  handleRequestClick,
  user,
}: NotificationsPageDesktopViewProps) {
  const content = (
    <DesktopContentPage
      title="Уведомления"
      description={unreadCount > 0 ? `${unreadCount} непрочитанных` : "Все прочитаны"}
      dark
      actions={
        <Bell className="h-5 w-5 text-[#E85D2B]" aria-hidden />
      }
    >
      <div ref={containerRef} className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
        <NotificationsDesktopList
          notifications={notifications}
          isLoading={isLoading}
          hasMore={hasMore}
          onNotificationPress={handleNotificationPress}
          onRequestClick={handleRequestClick}
        />
      </div>
    </DesktopContentPage>
  );

  return wrapWithShell(user?.role, content);
}
