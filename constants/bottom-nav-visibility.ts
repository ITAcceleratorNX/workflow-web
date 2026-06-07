/**
 * Реестр страниц, где mobile BottomNav скрыт.
 *
 * Parity с workflow-mobile: nav виден только на 5 tab-root экранах `(tabs)`.
 * Всё остальное — drill-down / modal / stack push → nav скрыт.
 *
 * ## Как добавить новую страницу
 *
 * 1. **Точный path** → `BOTTOM_NAV_HIDDEN_EXACT_PATHS`
 * 2. **Path + все вложенные** → `BOTTOM_NAV_HIDDEN_PREFIXES`
 * 3. **Динамический segment** → `BOTTOM_NAV_HIDDEN_PATTERNS` (RegExp)
 * 4. **Группа под prefix, кроме hub-страницы** → `BOTTOM_NAV_HIDDEN_HUB_DRILLDOWNS`
 * 5. **Client drill-down** (весь `/client/*` кроме tab roots) → `CLIENT_BOTTOM_NAV_ROOTS`
 * 6. **Временно (модалка, форма)** → `useBottomNavUiStore.setForceHidden` или `useBookingTabUiStore`
 */

/** Tab-root страницы client: nav **виден**. Все остальные `/client/*` — скрыт (RN `app/client/*` stack). */
export const CLIENT_BOTTOM_NAV_ROOTS = ["/client", "/client/requests"] as const;

/**
 * Hub-страницы management: nav **виден** на hub, скрыт на `/hub/.../child`.
 * Parity: RN admin-worker/department-head/executor management drill-downs вне tabs.
 */
export const BOTTOM_NAV_VISIBLE_HUBS = [
  "/admin-worker/management",
  "/department-head/management",
  "/executor/management",
] as const;

/** Точные path — nav скрыт. */
export const BOTTOM_NAV_HIDDEN_EXACT_PATHS = [
  "/create-request",
  "/settings",
  "/notifications",
  "/change-password",
] as const;

/** Prefix — nav скрыт на path и всех вложенных. */
export const BOTTOM_NAV_HIDDEN_PREFIXES = [
  "/chat-bot",
  "/admin-worker/messages",
  "/manager/messages",
  "/settings/",
] as const;

/** RegExp — nav скрыт при совпадении. */
export const BOTTOM_NAV_HIDDEN_PATTERNS: RegExp[] = [
  // Request detail (nested stack requests/[id])
  /^\/(?:client|manager|admin-worker|department-head|executor)\/requests\/\d+$/,
  // Role statistics (RN: вне tabs)
  /^\/(?:admin-worker|department-head|executor|manager)\/statistics$/,
  // Booking QR / detail
  /^\/booking\/\d+$/,
];

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function isClientDrillDown(path: string): boolean {
  if (!path.startsWith("/client")) return false;
  return !CLIENT_BOTTOM_NAV_ROOTS.some((root) => path === root);
}

function isHubDrillDown(path: string): boolean {
  return BOTTOM_NAV_VISIBLE_HUBS.some((hub) => {
    if (!path.startsWith(`${hub}/`)) return false;
    return path.length > hub.length + 1;
  });
}

/** Path-based hide (без store flags). */
export function isBottomNavHiddenPath(path: string): boolean {
  if (BOTTOM_NAV_HIDDEN_EXACT_PATHS.includes(path as (typeof BOTTOM_NAV_HIDDEN_EXACT_PATHS)[number])) {
    return true;
  }

  if (BOTTOM_NAV_HIDDEN_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) {
    return true;
  }

  if (BOTTOM_NAV_HIDDEN_PATTERNS.some((pattern) => pattern.test(path))) {
    return true;
  }

  if (isClientDrillDown(path)) return true;
  if (isHubDrillDown(path)) return true;

  return false;
}
