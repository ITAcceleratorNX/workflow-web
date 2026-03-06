import type { LucideIcon } from "lucide-react";
import { House, LayoutGrid, Wrench, BarChart3, MessageCircle, User } from "lucide-react";

export interface ClientNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const clientNavItems: ClientNavItem[] = [
  { key: "cabinet", label: "Мой кабинет", href: "/client", icon: House },
  // Для десктопа раздел "Бронь" открывается на отдельном URL,
  // где используется тот же мобильный UI бронирования переговорок
  { key: "booking", label: "Бронь", href: "/meeting-rooms", icon: LayoutGrid },
  { key: "requests", label: "Заявки", href: "/client/requests", icon: Wrench },
  { key: "statistics", label: "Статистика", href: "/client/statistics", icon: BarChart3 },
  { key: "messages", label: "Сообщения", href: "/chat-bot", icon: MessageCircle },
  { key: "profile", label: "Профиль", href: "/profile", icon: User },
];

export function isClientNavItemActive(item: ClientNavItem, pathname: string, search: string): boolean {
  const path = pathname?.split("?")[0] || "";
  const tab = new URLSearchParams(search || "").get("tab");

  switch (item.key) {
    case "cabinet":
      return path === "/client" && (!tab || tab === "cabinet");
    case "booking":
      // Активен как при старом варианте (/client?tab=meeting-rooms),
      // так и при новом отдельном URL /meeting-rooms
      return (path === "/client" && tab === "meeting-rooms") || path.startsWith("/meeting-rooms");
    case "requests":
      return path.startsWith("/client/requests");
    case "statistics":
      return path.startsWith("/client/statistics");
    case "messages":
      return path.startsWith("/chat-bot");
    case "profile":
      return path === "/profile" || path.startsWith("/profile");
    default:
      return path === item.href || path.startsWith(item.href + "/");
  }
}
