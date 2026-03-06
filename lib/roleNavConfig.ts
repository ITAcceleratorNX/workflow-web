import type { LucideIcon } from "lucide-react";
import {
  House,
  LayoutGrid,
  Wrench,
  BarChart3,
  MessageCircle,
  Settings,
  User,
} from "lucide-react";

export type AdminManagerRole = "admin-worker" | "manager" | "department-head";

export interface NavItem {
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

const baseNavItems: NavItem[] = [
  { key: "dashboard", label: "Мой кабинет", href: "", icon: House },
  { key: "booking", label: "Бронь", href: "", icon: LayoutGrid },
  { key: "requests", label: "Заявки", href: "", icon: Wrench },
  { key: "statistics", label: "Статистика", href: "", icon: BarChart3, hideForDepartmentHead: true },
  { key: "messages", label: "Сообщения", href: "", icon: MessageCircle },
  { key: "management", label: "Управление", href: "", icon: Settings, hideForDepartmentHead: true },
  { key: "profile", label: "Профиль", href: "", icon: User },
];

export function getRoleNavConfig(role: AdminManagerRole): NavItem[] {
  return baseNavItems
    .filter((item) => {
      if (item.managerOnly && role !== "manager") return false;
      if (item.adminOnly && role !== "admin-worker") return false;
      if (item.hideForDepartmentHead && role === "department-head") return false;
      return true;
    })
    .map((item) => ({
      ...item,
      href:
        item.href ||
        (role === "admin-worker"
          ? getAdminHref(item.key)
          : role === "manager"
            ? getManagerHref(item.key)
            : getDepartmentHeadHref(item.key)),
    }));
}

function getAdminHref(key: string): string {
  switch (key) {
    case "dashboard":
      return "/admin-worker";
    case "booking":
      return "/admin-worker/booking";
    case "requests":
      return "/admin-worker/requests";
    case "statistics":
      return "/admin-worker/statistics";
    case "messages":
      return "/admin-worker/messages";
    case "management":
      return "/admin-worker/management";
    case "profile":
      return "/admin-worker/profile";
    default:
      return "/admin-worker";
  }
}

function getManagerHref(key: string): string {
  switch (key) {
    case "dashboard":
      return "/manager";
    case "booking":
      return "/manager/booking";
    case "requests":
      return "/manager/requests";
    case "statistics":
      return "/manager/statistics";
    case "messages":
      return "/manager/messages";
    case "management":
      return "/manager/management";
    case "profile":
      return "/manager/profile";
    default:
      return "/manager";
  }
}

function getDepartmentHeadHref(key: string): string {
  switch (key) {
    case "dashboard":
      return "/department-head";
    case "booking":
      return "/department-head/booking";
    case "requests":
      return "/department-head/requests";
    case "messages":
      return "/chat-bot";
    case "profile":
      return "/department-head/profile";
    default:
      return "/department-head";
  }
}

export function isNavItemActive(item: NavItem, pathname: string, role: AdminManagerRole): boolean {
  const path = pathname?.split("?")[0] || "";
  switch (item.key) {
    case "dashboard":
      return role === "admin-worker"
        ? path === "/admin-worker"
        : role === "manager"
          ? path === "/manager" || path === "/manager/cabinet"
          : path === "/department-head";
    case "booking":
      return path === "/meeting-rooms" || path.startsWith("/meeting-rooms") ||
        (role === "admin-worker" && path.startsWith("/admin-worker/booking")) ||
        (role === "manager" && path.startsWith("/manager/booking")) ||
        (role === "department-head" && path.startsWith("/department-head/booking"));
    case "requests":
      return role === "admin-worker"
        ? path.startsWith("/admin-worker/requests")
        : role === "manager"
          ? path.startsWith("/manager/requests")
          : path.startsWith("/department-head/requests");
    case "statistics":
      return role === "admin-worker"
        ? path.startsWith("/admin-worker/statistics")
        : path.startsWith("/manager/statistics");
    case "messages":
      return role === "admin-worker"
        ? path.startsWith("/admin-worker/messages")
        : role === "manager"
          ? path.startsWith("/manager/messages")
          : path.startsWith("/department-head/messages") || path.startsWith("/chat-bot");
    case "management":
      return role === "admin-worker"
        ? path.startsWith("/admin-worker/management")
        : path.startsWith("/manager/management");
    case "profile":
      return path === "/profile" || path.startsWith("/profile") ||
        (role === "admin-worker" && path.startsWith("/admin-worker/profile")) ||
        (role === "manager" && path.startsWith("/manager/profile")) ||
        (role === "department-head" && path.startsWith("/department-head/profile"));
    default:
      return path === item.href || path.startsWith(item.href + "/");
  }
}
