"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop, useMediaQuery } from "@/hooks/use-media-query";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

    // На мобилке и на малом десктопе (до 1200px) «Мой кабинет» — страница с карточками. Редирект /manager → /manager/cabinet если в URL нет tab/requestId.
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

  // Body class для тёмной темы Select/dropdown на мобилке
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

  const isManagerMainPage = pathname === "/manager";
  const isManagerMobileWithNav =
    pathname?.startsWith("/manager/cabinet") ||
    pathname === "/manager/statistics" ||
    pathname?.startsWith("/manager/requests") ||
    pathname?.startsWith("/manager/management");
  const wrapWithPadding = isManagerMainPage || isManagerMobileWithNav;

  // Обёртка без своего фона и без нижнего padding — полоса за навбаром заполняется фоном страницы (у каждой страницы свой pb + background)
  return wrapWithPadding ? (
    <div className="min-h-screen min-h-[100dvh] bg-transparent">
      {children}
    </div>
  ) : (
    <>{children}</>
  );
}
