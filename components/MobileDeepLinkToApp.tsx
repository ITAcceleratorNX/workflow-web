'use client'

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Пытается открыть установленное мобильное приложение по кастомной схеме
 * workflowmobile://?requestId=... на iOS/Android.
 *
 * Если приложения нет, пользователь просто остаётся на веб‑странице.
 */
export function MobileDeepLinkToApp() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    if (!isIOS && !isAndroid) return;

    const requestId = searchParams.get("requestId");
    if (!requestId) return;

    // Чтобы не дёргать приложение каждый раз при навигации
    const key = "workflowmobile_deeplink_triggered";
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");

    const schemeUrl = `workflowmobile://?requestId=${encodeURIComponent(
      requestId,
    )}`;

    // Попытка открыть приложение; если его нет, просто останемся на вебе.
    const timeout = setTimeout(() => {
      // fallback: ничего не делаем, остаёмся на текущей странице
    }, 1200);

    window.location.href = schemeUrl;

    return () => clearTimeout(timeout);
  }, [searchParams]);

  return null;
}

