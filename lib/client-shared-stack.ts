/**
 * RN `app/client/*` stack routes доступны любой авторизованной роли
 * (см. workflow-mobile/app/client/_layout.tsx — без role guard).
 */
const CLIENT_SHARED_STACK_PREFIXES = [
  "/client/tasks",
  "/client/statistics",
  "/client/teams",
] as const;

export function isClientSharedStackPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "";
  return CLIENT_SHARED_STACK_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
