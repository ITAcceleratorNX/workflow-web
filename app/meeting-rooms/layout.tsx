"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAuthStore } from "@/stores/useAuthStore";

export default function MeetingRoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const isClient = (user?.role ?? role) === "client";

  // На десктопе у клиента «Бронь» показывается как вкладка на /client (поведение из dd3be4ef)
  useEffect(() => {
    if (isDesktop && isClient) {
      router.replace("/client?tab=meeting-rooms");
    }
  }, [isDesktop, isClient, router]);

  // Пока редирект выполняется или не клиент/не десктоп — рендерим страницу как есть
  if (isDesktop && isClient) {
    return null; // редирект уведёт на /client?tab=meeting-rooms
  }

  return <>{children}</>;
}

