"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  getPendingRequestId,
  clearPendingRequestId,
  getRequestRedirectUrl,
} from "@/lib/shareRequest";

/**
 * Если пользователь зашёл по ссылке с requestId, но редирект привёл на страницу без заявки —
 * восстанавливаем из sessionStorage и редиректим как при клике по ID в уведомлениях.
 */
export function RestorePendingRequestUrl() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuthStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = pathname ?? window.location.pathname;
    if (path === "/" || path === "/login") return;
    if (!role) return;

    const hasRequestId = searchParams.get("requestId");
    if (hasRequestId) return;

    const pendingId = getPendingRequestId();
    if (!pendingId) return;

    clearPendingRequestId();
    router.replace(getRequestRedirectUrl(role, pendingId, isDesktop));
  }, [pathname, router, searchParams, role, isDesktop]);

  return null;
}
