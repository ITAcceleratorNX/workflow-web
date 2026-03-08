"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMediaQuery, useMediaQueryResolved } from "@/hooks/use-media-query";
import { ClientDesktopShell } from "@/components/layout/ClientDesktopShell";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { matches: isDesktopResolved, resolved: mediaResolved } = useMediaQueryResolved("(min-width: 768px)");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!user || user.role !== "client") {
      clearAuth();
      router.push("/login");
      return;
    }
  }, [hydrated, user, router, clearAuth]);

  // При переходе с десктопа на мобильную версию — сразу открывать /cabinet (мобильный «дом» клиента)
  // Используем mediaResolved, чтобы не редиректить до определения размера экрана (избегаем ложного редиректа на десктопе)
  useEffect(() => {
    if (!hydrated || !mediaResolved || isDesktopResolved) return;
    if (pathname === "/client") {
      router.replace("/cabinet");
    }
  }, [hydrated, mediaResolved, isDesktopResolved, pathname, router]);

  if (!hydrated || !user) {
    return null;
  }

  if (isDesktop) {
    return <ClientDesktopShell>{children}</ClientDesktopShell>;
  }

  return <>{children}</>;
}
