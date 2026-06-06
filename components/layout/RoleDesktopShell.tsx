"use client";

import React from "react";
import { DesktopShellLayout } from "@/components/layout/DesktopShellLayout";
import type { AdminManagerRole } from "@/constants/roles";
import {
  DESKTOP_SIDEBAR_STORAGE_KEYS,
  getRoleLabel,
  getRoleProfileHref,
  getRoleRequestsNotificationPath,
} from "@/constants/roles";
import { useAdminManagerDesktopSidebarNav } from "@/hooks/use-desktop-sidebar-nav";
import { useAuthStore } from "@/stores/useAuthStore";

export interface RoleDesktopShellProps {
  role: AdminManagerRole;
  children: React.ReactNode;
  /** Optional right column (e.g. NotificationsSidebar) */
  rightSlot?: React.ReactNode;
}

export function RoleDesktopShell({ role, children, rightSlot }: RoleDesktopShellProps) {
  const { user } = useAuthStore();
  const sidebarItems = useAdminManagerDesktopSidebarNav(role);

  return (
    <DesktopShellLayout
      sidebarStorageKey={DESKTOP_SIDEBAR_STORAGE_KEYS.admin}
      sidebarSubtitle="Система управления"
      sidebarItems={sidebarItems}
      headerRole={getRoleLabel(user?.role)}
      profileHref={getRoleProfileHref(role)}
      requestsPathForNotification={getRoleRequestsNotificationPath(role)}
      rightSlot={rightSlot}
    >
      {children}
    </DesktopShellLayout>
  );
}
