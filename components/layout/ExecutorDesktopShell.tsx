"use client";

import React from "react";
import { DesktopShellLayout } from "@/components/layout/DesktopShellLayout";
import { DESKTOP_SIDEBAR_STORAGE_KEYS } from "@/constants/roles";
import { useExecutorDesktopSidebarNav } from "@/hooks/use-desktop-sidebar-nav";

export interface ExecutorDesktopShellProps {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function ExecutorDesktopShell({ children, rightSlot }: ExecutorDesktopShellProps) {
  const sidebarItems = useExecutorDesktopSidebarNav();

  return (
    <DesktopShellLayout
      sidebarStorageKey={DESKTOP_SIDEBAR_STORAGE_KEYS.executor}
      sidebarSubtitle="Исполнитель"
      sidebarItems={sidebarItems}
      headerRole="Исполнитель"
      profileHref="/profile"
      requestsPathForNotification="/executor/requests"
      shellClassName="client-desktop-shell"
      rightSlot={rightSlot}
    >
      {children}
    </DesktopShellLayout>
  );
}
