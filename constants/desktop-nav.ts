import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Heart,
  House,
  LayoutGrid,
  MessageCircle,
  Newspaper,
  Settings,
  User,
  Wrench,
} from 'lucide-react';
import type { AdminManagerRole } from '@/constants/roles';
import { ROLE_BASE_PATH } from '@/constants/roles';

export interface DesktopNavItemConfig {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only show for manager role */
  managerOnly?: boolean;
  /** Only show for admin-worker role */
  adminOnly?: boolean;
  /** Hide for department-head (e.g. statistics, management) */
  hideForDepartmentHead?: boolean;
}

export const CLIENT_DESKTOP_NAV: DesktopNavItemConfig[] = [
  { key: 'cabinet', label: 'Мой кабинет', href: '/client', icon: House },
  { key: 'news', label: 'Новости', href: '/client/news', icon: Newspaper },
  { key: 'tasks', label: 'Задачи', href: '/client/tasks', icon: CheckSquare },
  { key: 'wellness', label: 'Wellness', href: '/client/health', icon: Heart },
  { key: 'booking', label: 'Бронь', href: '/client?tab=meeting-rooms', icon: LayoutGrid },
  { key: 'requests', label: 'Заявки', href: '/client/requests', icon: Wrench },
  { key: 'statistics', label: 'Статистика', href: '/client/statistics', icon: BarChart3 },
  { key: 'messages', label: 'Сообщения', href: '/chat-bot', icon: MessageCircle },
  { key: 'profile', label: 'Профиль', href: '/profile', icon: User },
];

export const EXECUTOR_DESKTOP_NAV: DesktopNavItemConfig[] = [
  { key: 'main', label: 'Главная', href: '/executor', icon: House },
  { key: 'management', label: 'Кабинет', href: '/executor/management', icon: LayoutGrid },
  { key: 'requests', label: 'Заявки', href: '/executor/requests', icon: Wrench },
  { key: 'booking', label: 'Бронирование', href: '/executor?tab=booking', icon: CalendarDays },
  { key: 'statistics', label: 'Статистика', href: '/executor/statistics', icon: BarChart3 },
  { key: 'profile', label: 'Профиль', href: '/profile', icon: User },
];

const ADMIN_MANAGER_NAV_TEMPLATE: DesktopNavItemConfig[] = [
  { key: 'dashboard', label: 'Мой кабинет', href: '', icon: House },
  { key: 'booking', label: 'Бронь', href: '', icon: LayoutGrid },
  { key: 'requests', label: 'Заявки', href: '', icon: Wrench },
  {
    key: 'statistics',
    label: 'Статистика',
    href: '',
    icon: BarChart3,
    hideForDepartmentHead: true,
  },
  { key: 'messages', label: 'Сообщения', href: '', icon: MessageCircle },
  {
    key: 'management',
    label: 'Управление',
    href: '',
    icon: Settings,
    hideForDepartmentHead: true,
  },
  { key: 'profile', label: 'Профиль', href: '', icon: User },
];

function getAdminManagerNavHref(role: AdminManagerRole, key: string): string {
  const base = ROLE_BASE_PATH[role];

  switch (key) {
    case 'dashboard':
      return role === 'manager' ? base : base;
    case 'booking':
      return `${base}/booking`;
    case 'requests':
      return `${base}/requests`;
    case 'statistics':
      return `${base}/statistics`;
    case 'messages':
      return role === 'department-head' ? '/chat-bot' : `${base}/messages`;
    case 'management':
      return `${base}/management`;
    case 'profile':
      return role === 'department-head' ? `${base}/profile` : `${base}/profile`;
    default:
      return base;
  }
}

export function getAdminManagerDesktopNav(
  role: AdminManagerRole
): DesktopNavItemConfig[] {
  return ADMIN_MANAGER_NAV_TEMPLATE.filter((item) => {
    if (item.managerOnly && role !== 'manager') return false;
    if (item.adminOnly && role !== 'admin-worker') return false;
    if (item.hideForDepartmentHead && role === 'department-head') return false;
    return true;
  }).map((item) => ({
    ...item,
    href: item.href || getAdminManagerNavHref(role, item.key),
  }));
}

export function isClientDesktopNavActive(
  item: DesktopNavItemConfig,
  pathname: string,
  search: string
): boolean {
  const path = pathname?.split('?')[0] || '';
  const tab = new URLSearchParams(search || '').get('tab');

  switch (item.key) {
    case 'cabinet':
      return path === '/client' && (!tab || tab === 'cabinet');
    case 'news':
      return path.startsWith('/client/news');
    case 'tasks':
      return path.startsWith('/client/tasks') || path.startsWith('/client/teams');
    case 'wellness':
      return (
        path.startsWith('/client/health') ||
        path.startsWith('/client/sleep') ||
        path.startsWith('/client/steps')
      );
    case 'booking':
      return path === '/client' && tab === 'meeting-rooms';
    case 'requests':
      return path.startsWith('/client/requests');
    case 'statistics':
      return path.startsWith('/client/statistics');
    case 'messages':
      return path.startsWith('/chat-bot');
    case 'profile':
      return path === '/profile' || path.startsWith('/profile');
    default:
      return path === item.href || path.startsWith(`${item.href}/`);
  }
}

export function isExecutorDesktopNavActive(
  item: DesktopNavItemConfig,
  pathname: string,
  search: string
): boolean {
  const path = pathname?.split('?')[0] || '';
  const tab = new URLSearchParams(search || '').get('tab');

  switch (item.key) {
    case 'main':
      return path === '/executor' && (!tab || tab === 'main');
    case 'management':
      return path.startsWith('/executor/management');
    case 'requests':
      return path.startsWith('/executor/requests');
    case 'booking':
      return path === '/executor' && tab === 'booking';
    case 'statistics':
      return path.startsWith('/executor/statistics');
    case 'profile':
      return path === '/profile' || path.startsWith('/profile');
    default:
      return path === item.href || path.startsWith(`${item.href}/`);
  }
}

export function isAdminManagerDesktopNavActive(
  item: DesktopNavItemConfig,
  pathname: string,
  role: AdminManagerRole
): boolean {
  const path = pathname?.split('?')[0] || '';

  switch (item.key) {
    case 'dashboard':
      return role === 'admin-worker'
        ? path === '/admin-worker'
        : role === 'manager'
          ? path === '/manager' || path === '/manager/cabinet'
          : path === '/department-head';
    case 'booking':
      return (
        path === '/meeting-rooms' ||
        path.startsWith('/meeting-rooms') ||
        path.startsWith(`${ROLE_BASE_PATH[role]}/booking`)
      );
    case 'requests':
      return path.startsWith(`${ROLE_BASE_PATH[role]}/requests`);
    case 'statistics':
      return role === 'admin-worker'
        ? path.startsWith('/admin-worker/statistics')
        : path.startsWith('/manager/statistics');
    case 'messages':
      return role === 'admin-worker'
        ? path.startsWith('/admin-worker/messages')
        : role === 'manager'
          ? path.startsWith('/manager/messages')
          : path.startsWith('/chat-bot');
    case 'management':
      return path.startsWith(`${ROLE_BASE_PATH[role]}/management`);
    case 'profile':
      return (
        path === '/profile' ||
        path.startsWith('/profile') ||
        path.startsWith(`${ROLE_BASE_PATH[role]}/profile`)
      );
    default:
      return path === item.href || path.startsWith(`${item.href}/`);
  }
}