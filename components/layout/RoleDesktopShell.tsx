"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMediaQuery } from "@/hooks/use-media-query";
import Header from "@/app/header/Header";
import { cn } from "@/lib/utils";
import type { AdminManagerRole } from "@/lib/roleNavConfig";
import { getRoleNavConfig, isNavItemActive } from "@/lib/roleNavConfig";
import { DesktopSidebar, type DesktopSidebarItem } from "@/components/layout/DesktopSidebar";
import { usePathname } from "next/navigation";

const SIDEBAR_COLLAPSED_KEY = "workflow-sidebar-collapsed";

const roleTranslations: Record<string, string> = {
  client: "Клиент",
  "admin-worker": "Администратор",
  "department-head": "Офис менеджер",
  executor: "Исполнитель",
  manager: "Руководитель",
};

interface RoleDesktopShellProps {
  role: AdminManagerRole;
  children: React.ReactNode;
  /** Optional right column (e.g. NotificationsSidebar) */
  rightSlot?: React.ReactNode;
}

export function RoleDesktopShell({ role, children, rightSlot }: RoleDesktopShellProps) {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) setSidebarCollapsed(stored === "true");
  }, []);

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch (_) {}
      return next;
    });
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const navItems = getRoleNavConfig(role);
  const sidebarItems: DesktopSidebarItem[] = navItems.map((item) => ({
    key: item.key,
    label: item.label,
    href: item.href,
    icon: item.icon,
    isActive: isNavItemActive(item, pathname || "", role),
  }));

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-[#1A1A1A]">
      <DesktopSidebar
        title="WorkFlow"
        subtitle="Система управления"
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
          role={roleTranslations[user?.role || ""] || user?.role || "Пользователь"}
          variant="dark"
          profileHref={
            role === "admin-worker"
              ? "/admin-worker/profile"
              : role === "manager"
                ? "/manager/profile"
                : "/department-head/profile"
          }
          requestsPathForNotification={
            role === "manager"
              ? "/manager/requests"
              : role === "department-head"
                ? "/department-head/requests"
                : "/admin-worker/requests"
          }
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
