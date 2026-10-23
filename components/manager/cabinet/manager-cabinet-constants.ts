import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

export type ManagerCabinetCardKey =
  | "meeting-rooms"
  | "management"
  | "offices"
  | "users"
  | "registration-requests"
  | "statistics";

export interface ManagerCabinetCard {
  key: ManagerCabinetCardKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
}

/**
 * Desktop «Мой кабинет». Плиток «Обзор» и «Аналитика» больше нет — они вели на те же
 * данные, что и «Статистика».
 */
export const MANAGER_CABINET_CARDS: ManagerCabinetCard[] = [
  {
    key: "meeting-rooms",
    title: "Переговорные",
    subtitle: "Бронирование и управление переговорными",
    icon: Building2,
    href: "/manager/booking",
  },
  {
    key: "management",
    title: "Управление",
    subtitle: "Офисы, пользователи, категории",
    icon: Settings,
    href: "/manager/management",
  },
  {
    key: "registration-requests",
    title: "Регистрации",
    subtitle: "Запросы на регистрацию пользователей",
    icon: UserPlus,
    href: "/manager/management?tab=registration-requests",
  },
  {
    key: "statistics",
    title: "Статистика",
    subtitle: "Заявки, сроки, оценки, загрузка переговорных, экспорт",
    icon: BarChart3,
    href: "/manager/statistics",
  },
];

/** Mobile «Управление» (переговорные — во вкладке «Бронь» нижнего меню). */
export const MANAGER_MOBILE_CABINET_CARDS: ManagerCabinetCard[] = [
  {
    key: "offices",
    title: "Управление офисами",
    subtitle: "Добавление и управление офисами компании",
    icon: Building2,
    href: "/manager/management",
  },
  {
    key: "users",
    title: "Управление пользователями",
    subtitle: "Пользователи и запросы на регистрацию",
    icon: Users,
    href: "/manager/management?section=users",
  },
  {
    key: "statistics",
    title: "Статистика",
    subtitle: "Заявки, сроки выполнения и оценки",
    icon: BarChart3,
    href: "/manager/statistics",
  },
];

/** Старые ссылки «/manager?tab=…» — куда эти разделы переехали. */
export const MANAGER_LEGACY_TAB_ROUTES: Record<string, string> = {
  overview: "/manager/statistics",
  analytics: "/manager/statistics",
  workload: "/manager/statistics",
  requests: "/manager/requests",
  logs: "/manager/requests?tab=logs",
  "meeting-rooms": "/manager/booking",
  "registration-requests": "/manager/management?tab=registration-requests",
  management: "/manager/management",
};
