"use client";

import React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { ClientDesktopShell } from "@/components/layout/ClientDesktopShell";

export default function MeetingRoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { user } = useAuthStore();

  // Мобильная версия и все нероль-клиент остаются как есть
  if (!isDesktop || user?.role !== "client") {
    return <>{children}</>;
  }

  // Десктоп для клиента: тот же шелл, что и в /client
  return <ClientDesktopShell>{children}</ClientDesktopShell>;
}

