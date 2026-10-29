/**
 * Гостевая ссылка на сервисную заявку (ТЗ «Поделиться сервисной заявкой»).
 * Ссылку `/r/{token}` выдаёт backend: по ней заявку можно посмотреть без входа и приложения.
 * Путь `/r/` не перехватывается App Links мобильного приложения, поэтому у получателя
 * ссылка всегда открывается в браузере; в приложение ведёт кнопка «Войти в Workflow».
 */

export const GUEST_REQUEST_PATH = "/r";

export function guestRequestUrl(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, "")}${GUEST_REQUEST_PATH}/${encodeURIComponent(token)}`;
}

/** Номер и прямая ссылка — то, что получает адресат в мессенджере. */
export function requestShareText(requestId: number, title?: string | null): string {
  const name = title?.trim();
  return name ? `Заявка #${requestId}: ${name}` : `Заявка #${requestId}`;
}

export function requestShareMessage(requestId: number, url: string, title?: string | null): string {
  return `${requestShareText(requestId, title)}\n${url}`;
}

export function whatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function telegramShareUrl(url: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/** Адрес входа, после которого откроется заявка: `/` сохраняет requestId и ведёт на вход или в заявку. */
export function requestLoginPath(requestId: number): string {
  return `/?requestId=${requestId}`;
}

/** Схема мобильного приложения: app/_layout.tsx workflow-mobile открывает заявку по requestId. */
export function mobileAppRequestUrl(requestId: number): string {
  return `workflowmobile://?requestId=${requestId}`;
}

export function isPhoneUserAgent(userAgent: string): boolean {
  return /iPhone|iPod|Android/i.test(userAgent);
}
