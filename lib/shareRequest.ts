/**
 * Утилиты для шаринга заявок и парсинга deep link URL (как в workflow-mobile).
 * Ссылка открывается в веб-приложении или в мобильном приложении (Universal/App Links).
 */

const STATUS_LABELS: Record<string, string> = {
  completed: "Завершена",
  in_progress: "В процессе",
  awaiting_assignment: "Ожидает назначения",
  execution: "Выполняется",
  assigned: "Назначена",
  rejected: "Отклонена",
  cancelled: "Отменена",
};

function translateStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export interface ShareRequestParams {
  requestId: number;
  subRequestId?: number;
  title?: string;
  status?: string;
  description?: string;
}

function getWebAppBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return (process.env.NEXT_PUBLIC_APP_URL as string) || "";
}

/**
 * Собирает URL заявки для шаринга.
 */
export function getRequestShareUrl(params: ShareRequestParams): string {
  const base = getWebAppBaseUrl().replace(/\/$/, "");
  const search = new URLSearchParams();
  search.set("requestId", String(params.requestId));
  if (params.subRequestId != null) {
    search.set("subRequestId", String(params.subRequestId));
  }
  return `${base}?${search.toString()}`;
}

/**
 * Текст сообщения для шаринга заявки.
 */
export function getRequestShareMessage(params: ShareRequestParams): string {
  const displayId =
    params.subRequestId != null
      ? `${params.requestId}/${params.subRequestId}`
      : String(params.requestId);
  const title = params.title ?? "Заявка";
  const status = translateStatus(params.status ?? "");
  const desc = (params.description ?? "").slice(0, 200);
  const shortDesc =
    params.description && params.description.length > 200 ? `${desc}...` : desc;
  const url = getRequestShareUrl(params);
  return (
    `Заявка #${displayId}\n\n` +
    `Название: ${title}\n` +
    `Статус: ${status}\n` +
    (shortDesc ? `Описание: ${shortDesc}\n\n` : "\n") +
    `Ссылка: ${url}`
  );
}

/**
 * URL для открытия WhatsApp с предзаполненным сообщением.
 */
export function getWhatsAppShareUrl(params: ShareRequestParams): string {
  const message = getRequestShareMessage(params);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

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
