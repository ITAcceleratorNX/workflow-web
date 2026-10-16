/**
 * Счётчик раздела «Заявки»: сколько заявок ждут действия текущего пользователя.
 * Число считает бэкенд (GET /request-groups/action-count) — так оно одинаковое
 * в мобильной и десктопной вёрстке и переживает перезагрузку и повторный вход.
 * Это не счётчик непрочитанного: открытие заявки его не меняет.
 */

/** Роли со счётчиком. У руководителя платформы (manager) его нет. */
const REQUEST_ACTION_COUNT_ROLES = ["admin-worker", "department-head", "executor", "client"];

export const REQUEST_ACTION_COUNT_PATH = "/request-groups/action-count";

/** Событие окна: состояние заявок изменилось, число пора перечитать. */
export const REQUEST_ACTION_COUNT_REFRESH_EVENT = "workflow:request-action-count-refresh";

/** Как часто перечитывать число, пока вкладка открыта: заявки меняют и другие участники. */
export const REQUEST_ACTION_COUNT_POLL_MS = 30_000;

export function hasRequestActionCount(role: string | null | undefined): boolean {
  return role != null && REQUEST_ACTION_COUNT_ROLES.includes(role);
}

/** Текст бейджа; null — бейдж не показывать совсем (ни «0», ни пустого кружка). */
export function formatRequestActionBadge(count: number | null | undefined): string | null {
  if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) return null;
  return count > 99 ? "99+" : String(Math.floor(count));
}

export function requestActionBadgeLabel(count: number): string {
  return `Заявки: требуют действия — ${count}`;
}

const REQUEST_STATE_PATH_PREFIXES = ["/request-groups", "/requests", "/request-executors", "/ratings"];

/**
 * Запрос мог сдвинуть заявку по маршруту (создание, передача, назначение,
 * взятие в работу, завершение, оценка, удаление) — после него число перечитывается.
 */
export function isRequestStateMutation(
  method: string | null | undefined,
  url: string | null | undefined,
  baseURL?: string | null
): boolean {
  if (!method || !url || method.toUpperCase() === "GET") return false;
  let path = url;
  if (baseURL && path.startsWith(baseURL)) path = path.slice(baseURL.length);
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname.replace(/^\/api(?=\/)/, "");
    } catch {
      return false;
    }
  }
  path = `/${path.split("?")[0].replace(/^\/+/, "")}`;
  return REQUEST_STATE_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}
