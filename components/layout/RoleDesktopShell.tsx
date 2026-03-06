"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AdminManagerSidebar } from "./AdminManagerSidebar";
import Header from "@/app/header/Header";
import type { AdminManagerRole } from "@/lib/roleNavConfig";

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

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-[#1A1A1A]">
      <AdminManagerSidebar
        role={role}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleSidebarToggle}
      />
      <div className="flex-1 flex flex-col min-w-0">
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
