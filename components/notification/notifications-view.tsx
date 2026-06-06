"use client";

import { useNotificationsPage } from "@/hooks/use-notifications-page";
import { NotificationsDesktopView } from "./notifications-desktop-view";
import { NotificationsMobileView } from "./notifications-mobile-view";

export function NotificationsView() {
  const page = useNotificationsPage();
  const { user, isDesktop } = page;

  if (!user) return null;

  if (isDesktop) {
    return <NotificationsDesktopView {...page} />;
  }

  return <NotificationsMobileView {...page} />;
}
