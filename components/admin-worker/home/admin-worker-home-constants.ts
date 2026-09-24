import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  Building2,
  FolderTree,
  Home,
  MapPin,
  Network,
  Newspaper,
  Users,
} from "lucide-react";

export type AdminWorkerHomeCardKey =
  | "categories"
  | "location-templates"
  | "companies"
  | "structure"
  | "interaction-groups"
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
  /** Показывать только на одной платформе (оргструктура — только Desktop/Admin panel). */
  platform?: "desktop" | "mobile";
}

/** Parity с workflow-mobile ADMIN_MANAGEMENT_CARDS; href — web routes. */
const ADMIN_WORKER_HOME_CARDS: AdminWorkerHomeCard[] = [
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
    platform: "mobile",
  },
  {
    key: "structure",
    title: "Структура",
    subtitle: "Компании, отделы, сотрудники и руководители офиса",
    icon: Briefcase,
    href: "/admin-worker/management/structure",
    platform: "desktop",
  },
  {
    key: "interaction-groups",
    title: "Группы взаимодействия",
    subtitle: "Межкомпанейская постановка задач: кто с кем связан",
    icon: Network,
    href: "/admin-worker/management/interaction-groups",
    platform: "desktop",
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

export function adminWorkerHomeCardsFor(platform: "desktop" | "mobile"): AdminWorkerHomeCard[] {
  return ADMIN_WORKER_HOME_CARDS.filter((c) => !c.platform || c.platform === platform);
}
