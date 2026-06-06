/**
 * Роли, base paths и guards для навигации и списков заявок.
 */

export type RequestGroupsRole =
  | 'client'
  | 'admin-worker'
  | 'department-head'
  | 'executor'
  | 'manager';

export type AdminManagerRole = 'admin-worker' | 'manager' | 'department-head';

export const REQUEST_GROUPS_ROLES: RequestGroupsRole[] = [
  'client',
  'admin-worker',
  'department-head',
  'executor',
  'manager',
];

export const ADMIN_MANAGER_ROLES: AdminManagerRole[] = [
  'admin-worker',
  'manager',
  'department-head',
];

export const ROLE_BASE_PATH: Record<RequestGroupsRole, string> = {
  'admin-worker': '/admin-worker',
  'department-head': '/department-head',
  executor: '/executor',
  client: '/client',
  manager: '/manager',
};

export function getRoleBasePath(role: string | null | undefined): string {
  const r = (role || 'client') as RequestGroupsRole;
  return ROLE_BASE_PATH[r] ?? '/client';
}

export function getRequestsListPath(role: string | null | undefined): string {
  return `${getRoleBasePath(role)}/requests`;
}

export function isRequestGroupsRole(
  role: string | null | undefined
): role is RequestGroupsRole {
  return role != null && role in ROLE_BASE_PATH;
}

export function isAdminManagerRole(
  role: string | null | undefined
): role is AdminManagerRole {
  return role === 'admin-worker' || role === 'manager' || role === 'department-head';
}

/** Вкладки списка заявок по ролям (как в workflow-mobile). */
export const REQUESTS_TABS_BY_ROLE: Record<
  string,
  { key: string; label: string }[]
> = {
  executor: [
    { key: 'tasks', label: 'Мои задачи' },
    { key: 'myTasks', label: 'Мои заявки' },
    { key: 'completed', label: 'Завершённые' },
  ],
  'admin-worker': [
    { key: 'incoming', label: 'Входящие' },
    { key: 'my', label: 'Мои' },
  ],
  'department-head': [
    { key: 'incoming', label: 'Входящие' },
    { key: 'my', label: 'Мои' },
  ],
};

/** Карточка исполнителя отличается от клиента / admin-worker / department-head / manager. */
export function usesExecutorRequestCard(
  role: RequestGroupsRole | string | null | undefined
): boolean {
  return role === 'executor';
}

/** Отображаемые названия ролей в desktop header. */
export const ROLE_LABELS: Record<RequestGroupsRole, string> = {
  client: 'Клиент',
  'admin-worker': 'Администратор',
  'department-head': 'Офис менеджер',
  executor: 'Исполнитель',
  manager: 'Руководитель',
};

export function getRoleLabel(role: string | null | undefined): string {
  if (role && role in ROLE_LABELS) {
    return ROLE_LABELS[role as RequestGroupsRole];
  }
  return role || 'Пользователь';
}

export function getRoleProfileHref(role: RequestGroupsRole): string {
  switch (role) {
    case 'admin-worker':
      return '/admin-worker/profile';
    case 'manager':
      return '/manager/profile';
    case 'department-head':
      return '/department-head/profile';
    default:
      return '/profile';
  }
}

export function getRoleRequestsNotificationPath(role: RequestGroupsRole): string {
  return `${ROLE_BASE_PATH[role]}/requests`;
}

/** localStorage keys для collapsed state desktop sidebar. */
export const DESKTOP_SIDEBAR_STORAGE_KEYS = {
  client: 'workflow-sidebar-collapsed-client',
  executor: 'workflow-sidebar-collapsed-executor',
  admin: 'workflow-sidebar-collapsed',
} as const;

export type DesktopSidebarStorageKey =
  (typeof DESKTOP_SIDEBAR_STORAGE_KEYS)[keyof typeof DESKTOP_SIDEBAR_STORAGE_KEYS];
