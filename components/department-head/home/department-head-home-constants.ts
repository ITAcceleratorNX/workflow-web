import type { LucideIcon } from "lucide-react";
import { BarChart3, Briefcase, FolderTree, MapPin, Users } from "lucide-react";

export type DepartmentHeadHomeCardKey =
  | "categories"
  | "location-templates"
  | "companies"
  | "users"
  | "statistics";

export interface DepartmentHeadHomeCard {
  key: DepartmentHeadHomeCardKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
}

/** Parity с workflow-mobile DEPARTMENT_HEAD_MANAGEMENT_CARDS. */
export const DEPARTMENT_HEAD_HOME_CARDS: DepartmentHeadHomeCard[] = [
  {
    key: "categories",
    title: "Категории услуг",
    subtitle: "Категории и подкатегории вашего офиса",
    icon: FolderTree,
    href: "/department-head/management/categories",
  },
  {
    key: "location-templates",
    title: "Шаблоны локаций",
    subtitle: "Блок, этаж и помещения для заявок в вашем офисе",
    icon: MapPin,
    href: "/department-head/management/location-catalog",
  },
  {
    key: "companies",
    title: "Компании",
    subtitle: "Арендаторы вашего офиса",
    icon: Briefcase,
    href: "/department-head/management/companies",
  },
  {
    key: "users",
    title: "Пользователи",
    subtitle: "Клиенты и исполнители офиса, пароли и роли",
    icon: Users,
    href: "/department-head/management/users",
  },
  {
    key: "statistics",
    title: "Аналитика",
    subtitle: "SLA, оценки, статистика по заявкам",
    icon: BarChart3,
    href: "/department-head/statistics",
  },
];
