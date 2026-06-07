import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  Building2,
  FolderTree,
  Home,
  MapPin,
  Newspaper,
  Users,
} from "lucide-react";

export type AdminWorkerHomeCardKey =
  | "categories"
  | "location-templates"
  | "companies"
  | "users"
  | "office"
  | "smart-home"
  | "statistics"
  | "news";

export interface AdminWorkerHomeCard {
  key: AdminWorkerHomeCardKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
}

/** Parity с workflow-mobile ADMIN_MANAGEMENT_CARDS; href — web routes. */
export const ADMIN_WORKER_HOME_CARDS: AdminWorkerHomeCard[] = [
  {
    key: "categories",
    title: "Управление категориями",
    subtitle: "Категории и подкатегории всех офисов",
    icon: FolderTree,
    href: "/admin-worker/management/categories",
  },
  {
    key: "location-templates",
    title: "Шаблоны локаций",
    subtitle: "Блок, этаж и помещения для заявок по выбранному офису",
    icon: MapPin,
    href: "/admin-worker/management/location-catalog",
  },
  {
    key: "companies",
    title: "Компании",
    subtitle: "Арендаторы внутри офиса",
    icon: Briefcase,
    href: "/admin-worker/management/companies",
  },
  {
    key: "users",
    title: "Управление пользователями",
    subtitle: "Роли и запросы на регистрацию",
    icon: Users,
    href: "/admin-worker/management/users",
  },
  {
    key: "office",
    title: "Управление офисом",
    subtitle: "Кабинеты, переговорные, локации",
    icon: Building2,
    href: "/admin-worker/management/office",
  },
  {
    key: "smart-home",
    title: "Умный офис",
    subtitle: "Токены Яндекс и управление устройствами в переговорных",
    icon: Home,
    href: "/admin-worker/management/smart-home",
  },
  {
    key: "statistics",
    title: "Статистика",
    subtitle: "Отчёты и аналитика по заявкам",
    icon: BarChart3,
    href: "/admin-worker/statistics",
  },
  {
    key: "news",
    title: "Управление новостями",
    subtitle: "Создание и редактирование новостей для клиентов",
    icon: Newspaper,
    href: "/admin-worker/management/news",
  },
];
