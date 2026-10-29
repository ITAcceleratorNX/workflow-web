/**
 * Парсинг deep link URL заявки (как в workflow-mobile) и возврат к заявке после входа.
 * Ссылки «Поделиться» — гостевые, см. lib/request-share-link.ts.
 */

import { getRequestsListPath } from "@/constants/roles";

/**
 * Извлекает requestId из URL заявки.
 * Поддерживает:
 * - https://example.com?requestId=123 (текущий сайт или App Links)
 * - любой URL с query-параметром requestId
 * - путь вида /requests/123 (если есть в pathname)
 */
export function parseRequestDeepLinkUrl(url: string): { requestId: number } | null {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed = new URL(url);

    const fromQuery = parsed.searchParams.get("requestId");
    if (fromQuery) {
      const id = parseInt(fromQuery, 10);
      if (Number.isFinite(id) && id > 0) return { requestId: id };
    }

    const pathMatch = parsed.pathname.match(/\/requests\/(\d+)/);
    if (pathMatch) {
      const id = parseInt(pathMatch[1], 10);
      if (Number.isFinite(id) && id > 0) return { requestId: id };
    }

    return null;
  } catch {
    const fallback = url.match(/[?&]requestId=(\d+)/);
    if (fallback) {
      const id = parseInt(fallback[1], 10);
      if (Number.isFinite(id) && id > 0) return { requestId: id };
    }
    return null;
  }
}

const PENDING_REQUEST_KEY = "workflow_pending_request_id";

/** Сохранить только ID заявки (как при клике по уведомлению). */
export function savePendingRequestId(requestId: number): void {
  if (typeof window === "undefined" || !requestId) return;
  sessionStorage.setItem(PENDING_REQUEST_KEY, String(requestId));
}

/** Получить сохранённый ID заявки. */
export function getPendingRequestId(): number | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(PENDING_REQUEST_KEY);
  if (!v) return null;
  const id = parseInt(v, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** Очистить после использования. */
export function clearPendingRequestId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_REQUEST_KEY);
}

/**
 * URL для редиректа на заявку — та же логика, что при клике по ID в уведомлениях.
 */
export function getRequestRedirectUrl(
  role: string,
  requestId: number,
  isDesktop: boolean
): string {
  const requestUrl = isDesktop ? `?requestId=${requestId}` : `/${requestId}`;
  return `${getRequestsListPath(role)}${requestUrl}`;
}
