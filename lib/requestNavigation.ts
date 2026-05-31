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
  requestId: string | number
): string {
  const id =
    typeof requestId === "number" ? requestId : parseRequestGroupId(requestId);
  return `${basePath}?requestId=${id}`;
}

export function buildMobileRequestDetailPath(
  basePath: string,
  requestId: string | number
): string {
  const id =
    typeof requestId === "number" ? requestId : parseRequestGroupId(requestId);
  return `${basePath}/${id}`;
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
