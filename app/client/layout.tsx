"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ClientDesktopShell } from "@/components/layout/ClientDesktopShell";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const isDesktop = useIsDesktop();
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

  // На мобилке «Мой кабинет» — /client (главная client home, parity с RN).
  if (!hydrated || !user) {
    return null;
  }

  if (isDesktop) {
    return <ClientDesktopShell>{children}</ClientDesktopShell>;
  }

  return <>{children}</>;
}
