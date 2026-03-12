"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getPendingRequestQuery, clearPendingRequestQuery } from "@/lib/shareRequest";

/**
 * Если пользователь зашёл по ссылке с requestId, но редирект привёл на страницу без query —
 * восстанавливаем requestId из sessionStorage и подставляем в URL.
 */
export function RestorePendingRequestUrl() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = pathname ?? window.location.pathname;
    if (path === "/" || path === "/login") return;

    const hasRequestId = searchParams.get("requestId");
    if (hasRequestId) return;

    const pending = getPendingRequestQuery();
    if (!pending || !new URLSearchParams(pending).get("requestId")) return;

    clearPendingRequestQuery();
    router.replace(`${path}?${pending}`);
  }, [pathname, router, searchParams]);

  return null;
}
