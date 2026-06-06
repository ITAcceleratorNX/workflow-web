"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useDesktopSidebarCollapsed } from "@/hooks/use-desktop-sidebar";
import Header from "@/app/header/Header";
import {
  DesktopSidebar,
  type DesktopSidebarItem,
} from "@/components/layout/DesktopSidebar";
import type { DesktopSidebarStorageKey } from "@/constants/roles";
import { cn } from "@/lib/utils";

export interface DesktopShellLayoutProps {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
  sidebarStorageKey: DesktopSidebarStorageKey;
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  sidebarItems: DesktopSidebarItem[];
  headerRole: string;
  profileHref: string;
  requestsPathForNotification: string;
  shellClassName?: string;
}

export function DesktopShellLayout({
  children,
  rightSlot,
  sidebarStorageKey,
  sidebarTitle = "WorkFlow",
  sidebarSubtitle,
  sidebarItems,
  headerRole,
  profileHref,
  requestsPathForNotification,
  shellClassName,
}: DesktopShellLayoutProps) {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const isDesktop = useIsDesktop();
  const { collapsed: sidebarCollapsed, toggle: handleSidebarToggle } =
    useDesktopSidebarCollapsed(sidebarStorageKey);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "min-h-screen flex bg-[#1A1A1A]",
        shellClassName
      )}
    >
      <DesktopSidebar
        title={sidebarTitle}
        subtitle={sidebarSubtitle}
        items={sidebarItems}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleSidebarToggle}
      />
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-[margin] duration-200 ease-in-out",
          sidebarCollapsed ? "md:ml-[4.25rem]" : "md:ml-56 lg:ml-64"
        )}
      >
        <Header
          handleLogout={handleLogout}
          role={headerRole}
          variant="dark"
          profileHref={profileHref}
          requestsPathForNotification={requestsPathForNotification}
        />
        <div className="flex-1 flex min-h-0">
          <main className="flex-1 overflow-auto min-h-0 bg-[#1A1A1A]">
            {children}
          </main>
          {rightSlot && (
            <aside className="hidden lg:flex w-80 shrink-0 border-l border-white/10 overflow-auto">
              {rightSlot}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
