"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop, useMediaQuery } from "@/hooks/use-media-query";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";
import { MobileRoleShell } from "@/components/layout/MobileRoleShell";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const isDesktop = useIsDesktop();
  const isLargeDesktop = useMediaQuery("(min-width: 1200px)");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!user || user.role !== "manager") {
      clearAuth();
      router.push("/login");
      return;
    }

    const t = setTimeout(() => {
      if (typeof window === "undefined") return;
      const currentSearch = new URLSearchParams(window.location.search);
      const hasTab = currentSearch.get("tab");
      const hasRequestId = currentSearch.get("requestId");
      const hasParams = !!hasTab || !!hasRequestId;

      if (pathname === "/manager" && !hasParams) {
        if (!isDesktop || !isLargeDesktop) {
          router.replace("/manager/cabinet");
        }
      }
    }, 0);
    return () => clearTimeout(t);
  }, [hydrated, user, router, clearAuth, isDesktop, isLargeDesktop, pathname]);

  useEffect(() => {
    const isManagerPage = pathname === "/manager";
    const isManagerStatistics = pathname === "/manager/statistics";
    if (!isDesktop && (isManagerPage || isManagerStatistics)) {
      document.body.classList.add("manager-mobile");
    } else {
      document.body.classList.remove("manager-mobile");
    }
    return () => document.body.classList.remove("manager-mobile");
  }, [pathname, isDesktop]);

  if (!hydrated || !user) {
    return null;
  }

  if (isDesktop) {
    return (
      <RoleDesktopShell role="manager">
        {children}
      </RoleDesktopShell>
    );
  }

  return <MobileRoleShell>{children}</MobileRoleShell>;
}
