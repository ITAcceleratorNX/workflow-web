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

export type AdminManagerRole = "admin-worker" | "manager";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only show for manager role */
  managerOnly?: boolean;
  /** Only show for admin-worker role */
  adminOnly?: boolean;
}

const baseNavItems: NavItem[] = [
  { key: "dashboard", label: "Мой кабинет", href: "", icon: House },
  { key: "booking", label: "Бронь", href: "", icon: LayoutGrid },
  { key: "requests", label: "Заявки", href: "", icon: Wrench },
  { key: "statistics", label: "Статистика", href: "", icon: BarChart3 },
  { key: "messages", label: "Сообщения", href: "", icon: MessageCircle },
  { key: "management", label: "Управление", href: "", icon: Settings },
  { key: "profile", label: "Профиль", href: "", icon: User },
];

export function getRoleNavConfig(role: AdminManagerRole): NavItem[] {
  return baseNavItems
    .filter((item) => {
      if (item.managerOnly && role !== "manager") return false;
      if (item.adminOnly && role !== "admin-worker") return false;
      return true;
    })
    .map((item) => ({
      ...item,
      href: item.href || (role === "admin-worker" ? getAdminHref(item.key) : getManagerHref(item.key)),
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

export function isNavItemActive(item: NavItem, pathname: string, role: AdminManagerRole): boolean {
  const path = pathname?.split("?")[0] || "";
  switch (item.key) {
    case "dashboard":
      return role === "admin-worker"
        ? path === "/admin-worker"
        : path === "/manager" || path === "/manager/cabinet";
    case "booking":
      return path === "/meeting-rooms" || path.startsWith("/meeting-rooms") ||
        (role === "admin-worker" && path.startsWith("/admin-worker/booking")) ||
        (role === "manager" && path.startsWith("/manager/booking"));
    case "requests":
      return role === "admin-worker"
        ? path.startsWith("/admin-worker/requests")
        : path.startsWith("/manager/requests");
    case "statistics":
      return role === "admin-worker"
        ? path.startsWith("/admin-worker/statistics")
        : path.startsWith("/manager/statistics");
    case "messages":
      return role === "admin-worker"
        ? path.startsWith("/admin-worker/messages")
        : path.startsWith("/manager/messages");
    case "management":
      return role === "admin-worker"
        ? path.startsWith("/admin-worker/management")
        : path.startsWith("/manager/management");
    case "profile":
      return path === "/profile" || path.startsWith("/profile") ||
        (role === "admin-worker" && path.startsWith("/admin-worker/profile")) ||
        (role === "manager" && path.startsWith("/manager/profile"));
    default:
      return path === item.href || path.startsWith(item.href + "/");
  }
}
