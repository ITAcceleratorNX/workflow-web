"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import { BottomNav } from "@/components/BottomNav";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";

export default function AdminWorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const isDesktop = useIsDesktop();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!user || user.role !== "admin-worker") {
      clearAuth();
      router.push("/login");
    }
  }, [hydrated, user, router, clearAuth]);

  useEffect(() => {
    const isManagement = pathname?.startsWith("/admin-worker/management");
    const isRequests = pathname?.startsWith("/admin-worker/requests");
    const isStatistics = pathname?.startsWith("/admin-worker/statistics");
    if (!isDesktop && (isManagement || isRequests || isStatistics)) {
      document.body.classList.add("admin-management-mobile");
    } else {
      document.body.classList.remove("admin-management-mobile");
    }
    return () => document.body.classList.remove("admin-management-mobile");
  }, [pathname, isDesktop]);

  if (!hydrated || !user) {
    return null;
  }

  if (isDesktop) {
    return <RoleDesktopShell role="admin-worker">{children}</RoleDesktopShell>;
  }

  return (
    <div className="min-h-screen pb-[calc(110px+env(safe-area-inset-bottom,0px))] bg-[#1C1C1E]">
      {children}
      <BottomNav />
    </div>
  );
}
