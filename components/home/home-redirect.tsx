"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import {
  getRequestRedirectUrl,
  parseRequestDeepLinkUrl,
  savePendingRequestId,
} from "@/lib/shareRequest";

/** Ключ, по которому скрипт в <head> прячет описание до редиректа (без мелькания). */
export const HOME_REDIRECT_ATTR = "data-home-redirect";

/**
 * Скрипт до гидрации: вошедший пользователь, ссылка на заявку или нативное приложение
 * уйдут с главной сразу, поэтому описание сервиса им не показываем.
 */
export const HOME_REDIRECT_INIT_SCRIPT = `
(function() {
  try {
    var go = 'FCM' in window || /[?&]requestId=\\d/.test(location.search);
    var raw = localStorage.getItem('auth-storage');
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.state && parsed.state.role) go = true;
    }
    if (go) document.documentElement.setAttribute('${HOME_REDIRECT_ATTR}', '');
  } catch (e) {}
})();
`;

function isNativeShell(): boolean {
  return typeof window !== "undefined" && "FCM" in window;
}

/**
 * Вошедших ведёт в их раздел, гостя со ссылкой на заявку и нативное приложение — на вход.
 * Остальные гости остаются на главной с описанием сервиса (её индексирует поиск).
 */
export function HomeRedirect() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const parsed = parseRequestDeepLinkUrl(window.location.href);
    const requestId = parsed?.requestId;
    if (requestId) savePendingRequestId(requestId);

    if (role) {
      const url = requestId
        ? getRequestRedirectUrl(role, requestId, isDesktop)
        : role.toLowerCase() === "client"
          ? "/client"
          : `/${role.toLowerCase().replace(/\s+/g, "-")}`;
      router.replace(url);
      return;
    }
    if (requestId || isNativeShell()) {
      router.replace("/login");
      return;
    }
    document.documentElement.removeAttribute(HOME_REDIRECT_ATTR);
  }, [router, role, isDesktop]);

  return null;
}
