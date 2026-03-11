"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ExecutorSidebar } from "./ExecutorSidebar";
import Header from "@/app/header/Header";

interface ExecutorDesktopShellProps {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function ExecutorDesktopShell({ children, rightSlot }: ExecutorDesktopShellProps) {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-[#1A1A1A] client-desktop-shell">
      <ExecutorSidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-56 lg:ml-64">
        <Header
          handleLogout={handleLogout}
          role="Исполнитель"
          variant="dark"
          profileHref="/profile"
          requestsPathForNotification="/executor"
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
