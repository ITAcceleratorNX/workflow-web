"use client";

import React from "react";
import { DesktopShellLayout } from "@/components/layout/DesktopShellLayout";
import { DESKTOP_SIDEBAR_STORAGE_KEYS } from "@/constants/roles";
import { useClientDesktopSidebarNav } from "@/hooks/use-desktop-sidebar-nav";

export interface ClientDesktopShellProps {
  children: React.ReactNode;
  /** Optional right column (e.g. NotificationsSidebar) */
  rightSlot?: React.ReactNode;
}

export function ClientDesktopShell({ children, rightSlot }: ClientDesktopShellProps) {
  const sidebarItems = useClientDesktopSidebarNav();

  return (
    <DesktopShellLayout
      sidebarStorageKey={DESKTOP_SIDEBAR_STORAGE_KEYS.client}
      sidebarSubtitle="Система управления"
      sidebarItems={sidebarItems}
      headerRole="Клиент"
      profileHref="/profile"
      requestsPathForNotification="/client/requests"
      shellClassName="client-desktop-shell"
      rightSlot={rightSlot}
    >
      {children}
    </DesktopShellLayout>
  );
}
