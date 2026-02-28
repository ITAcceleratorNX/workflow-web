"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, clearAuth } = useAuthStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
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

    // На мобилке главная «Мой кабинет» — страница с карточками. Редирект /manager → /manager/cabinet только если в URL нет tab/requestId.
    // Откладываем проверку, чтобы при переходе по ссылке /manager?tab=... URL успел обновиться до проверки.
    const t = setTimeout(() => {
      if (typeof window === "undefined") return;
      const currentSearch = new URLSearchParams(window.location.search);
      const hasTab = currentSearch.get("tab");
      const hasRequestId = currentSearch.get("requestId");
      const hasParams = !!hasTab || !!hasRequestId;

      if (!isDesktop && pathname === "/manager" && !hasParams) {
        router.replace("/manager/cabinet");
      }
    }, 0);
    return () => clearTimeout(t);
  }, [hydrated, user, router, clearAuth, isDesktop, pathname]);

  // Body class для тёмной темы Select/dropdown на мобилке (как у admin-worker)
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

  // На мобилке тёмный фон для страниц кабинета менеджера (главная, статистика, заявки и т.д.), чтобы фон вокруг нижнего навбара совпадал
  const isManagerMainPage = pathname === "/manager";
  const isManagerMobileDarkPage =
    pathname?.startsWith("/manager/cabinet") ||
    pathname === "/manager/statistics" ||
    pathname?.startsWith("/manager/requests");
  const wrapWithDarkTheme = !isDesktop && (isManagerMainPage || isManagerMobileDarkPage);

  return wrapWithDarkTheme ? (
    <div
      className="min-h-screen min-h-[100dvh] pb-[calc(110px+env(safe-area-inset-bottom,0px))] bg-[#1C1C1E]"
    >
      {children}
    </div>
  ) : (
    <>{children}</>
  );
}
