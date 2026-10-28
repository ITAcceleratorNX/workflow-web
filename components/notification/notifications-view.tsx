"use client";

import { RequestNotFoundModal } from "@/components/RequestNotFoundModal";
import { useNotificationsPage } from "@/hooks/use-notifications-page";
import { NotificationsMobileView } from "./notifications-mobile-view";
import { NotificationsPageDesktopView } from "./notifications-page-desktop-view";

export function NotificationsView() {
  const page = useNotificationsPage();
  const { user, isDesktop } = page;

  if (!user) return null;

  if (isDesktop) {
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

  return <NotificationsMobileView {...page} />;
}
