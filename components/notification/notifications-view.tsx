"use client";

import { usePathname } from "next/navigation";
import { RequestNotFoundModal } from "@/components/RequestNotFoundModal";
import { useNotificationsPage } from "@/hooks/use-notifications-page";
import { NotificationsDesktopView } from "./notifications-desktop-view";
import { NotificationsMobileView } from "./notifications-mobile-view";
import { NotificationsPageDesktopView } from "./notifications-page-desktop-view";

export function NotificationsView() {
  const pathname = usePathname();
  const page = useNotificationsPage();
  const { user, isDesktop } = page;

  if (!user) return null;

  if (isDesktop) {
    if (pathname === "/notifications") {
      return (
        <>
          <NotificationsPageDesktopView {...page} />
          <RequestNotFoundModal
            isOpen={page.showNotFoundModal}
            onClose={() => page.setShowNotFoundModal(false)}
            requestId={page.notFoundRequestId}
          />
        </>
      );
    }
    return <NotificationsDesktopView {...page} />;
  }

  return <NotificationsMobileView {...page} />;
}
