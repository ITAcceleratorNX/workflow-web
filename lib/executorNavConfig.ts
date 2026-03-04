import type { LucideIcon } from "lucide-react";
import { House, Wrench, CalendarDays, BarChart3, User } from "lucide-react";

export interface ExecutorNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const executorNavItems: ExecutorNavItem[] = [
  { key: "main", label: "Главная", href: "/executor", icon: House },
  { key: "requests", label: "Заявки", href: "/executor/requests", icon: Wrench },
  { key: "booking", label: "Бронирование", href: "/executor?tab=booking", icon: CalendarDays },
  { key: "statistics", label: "Статистика", href: "/executor/statistics", icon: BarChart3 },
  { key: "profile", label: "Профиль", href: "/profile", icon: User },
];

export function isExecutorNavItemActive(
  item: ExecutorNavItem,
  pathname: string,
  search: string
): boolean {
  const path = pathname?.split("?")[0] || "";
  const tab = new URLSearchParams(search || "").get("tab");

  switch (item.key) {
    case "main":
      return path === "/executor" && (!tab || tab === "main");
    case "requests":
      return path.startsWith("/executor/requests");
    case "booking":
      return path === "/executor" && tab === "booking";
    case "statistics":
      return path.startsWith("/executor/statistics");
    case "profile":
      return path === "/profile" || path.startsWith("/profile");
    default:
      return path === item.href || path.startsWith(item.href + "/");
  }
}
