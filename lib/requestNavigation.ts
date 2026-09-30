/**
 * Навигация к заявке из уведомлений, header и deep-link.
 * Единые пути для всех ролей.
 */

export type RequestNavigationRole =
  | "client"
  | "executor"
  | "admin-worker"
  | "manager"
  | "department-head";

const REQUESTS_BASE_PATH: Record<RequestNavigationRole, string> = {
  client: "/client/requests",
  executor: "/executor/requests",
  "admin-worker": "/admin-worker/requests",
  manager: "/manager/requests",
  "department-head": "/department-head/requests",
};

/** ID группы заявки из строки вида "123" или "123/1" */
export function parseRequestGroupId(requestId: string): number {
  return parseInt(requestId.split("/")[0], 10);
}

export function getRequestsBasePathForRole(role: string): string | null {
  if (role in REQUESTS_BASE_PATH) {
    return REQUESTS_BASE_PATH[role as RequestNavigationRole];
  }
  return null;
}

export function buildRequestsUrlWithId(
  basePath: string,
  requestId: string | number,
  search = "",
): string {
  const id =
    typeof requestId === "number" ? requestId : parseRequestGroupId(requestId);
  const params = new URLSearchParams(search);
  params.set("requestId", String(id));
  return `${basePath}?${params.toString()}`;
}

/** Closing a detail panel removes its selection and keeps the list's filters. */
export function buildRequestsListPath(basePath: string, search = ""): string {
  const params = new URLSearchParams(search);
  params.delete("requestId");
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Reset only list filters; keep selection, tabs and other independent URL state. */
export function buildRequestsUrlWithoutFilters(basePath: string, search = ""): string {
  const params = new URLSearchParams(search);
  for (const key of ["status", "priority", "type", "office_id", "period"]) {
    params.delete(key);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** A URL without a period is an unfiltered list, including after reset/reload. */
export function getRequestListPeriod(value: string | null): "all" | "week" | "month" | "year" {
  return value === "week" || value === "month" || value === "year" ? value : "all";
}

export function buildMobileRequestDetailPath(
  basePath: string,
  requestId: string | number,
  search = "",
): string {
  const id =
    typeof requestId === "number" ? requestId : parseRequestGroupId(requestId);
  return buildRequestsListPath(`${basePath}/${id}`, search);
}

export function getRequestNavigationUrl(options: {
  role: string;
  requestId: string | number;
  isDesktop: boolean;
}): string | null {
  const basePath = getRequestsBasePathForRole(options.role);
  if (!basePath) return null;

  if (options.isDesktop) {
    return buildRequestsUrlWithId(basePath, options.requestId);
  }
  return buildMobileRequestDetailPath(basePath, options.requestId);
}
