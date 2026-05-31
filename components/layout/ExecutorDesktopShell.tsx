"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMediaQuery } from "@/hooks/use-media-query";
import Header from "@/app/header/Header";
import { DesktopSidebar, type DesktopSidebarItem } from "@/components/layout/DesktopSidebar";
import { executorNavItems, isExecutorNavItemActive } from "@/lib/executorNavConfig";
import { cn } from "@/lib/utils";

interface ExecutorDesktopShellProps {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}

const EXECUTOR_SIDEBAR_COLLAPSED_KEY = "workflow-sidebar-collapsed-executor";

export function ExecutorDesktopShell({ children, rightSlot }: ExecutorDesktopShellProps) {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(EXECUTOR_SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) setSidebarCollapsed(stored === "true");
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(EXECUTOR_SIDEBAR_COLLAPSED_KEY, String(next));
      } catch (_) {}
      return next;
    });
  };

  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const sidebarItems: DesktopSidebarItem[] = executorNavItems.map((item) => ({
    key: item.key,
    label: item.label,
    href: item.href,
    icon: item.icon,
    isActive: isExecutorNavItemActive(item, pathname || "", search),
  }));

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-[#1A1A1A] client-desktop-shell">
      <DesktopSidebar
        title="WorkFlow"
        subtitle="Исполнитель"
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
          role="Исполнитель"
          variant="dark"
          profileHref="/profile"
          requestsPathForNotification="/executor/requests"
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
