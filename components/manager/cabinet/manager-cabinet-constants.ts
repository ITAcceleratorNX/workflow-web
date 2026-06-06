import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  Settings,
  UserPlus,
} from "lucide-react";

export type ManagerCabinetCardKey =
  | "meeting-rooms"
  | "overview"
  | "analytics"
  | "management"
  | "registration-requests"
  | "statistics";

export interface ManagerCabinetCard {
  key: ManagerCabinetCardKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
}

export const MANAGER_CABINET_CARDS: ManagerCabinetCard[] = [
  {
    key: "meeting-rooms",
    title: "Переговорные",
    subtitle: "Бронирование и управление переговорными",
    icon: Building2,
    href: "/manager?tab=meeting-rooms",
  },
  {
    key: "overview",
    title: "Обзор",
    subtitle: "Распределение по типам и уведомления",
    icon: LayoutDashboard,
    href: "/manager?tab=overview",
  },
  {
    key: "analytics",
    title: "Аналитика",
    subtitle: "Отчёты и аналитика по заявкам",
    icon: BarChart3,
    href: "/manager?tab=analytics",
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
    href: "/manager?tab=registration-requests",
  },
  {
    key: "statistics",
    title: "Статистика",
    subtitle: "Детальная статистика и экспорт",
    icon: BarChart3,
    href: "/manager/statistics",
  },
];
