import type { LucideIcon } from "lucide-react";
import { BarChart3, Building2, Calendar } from "lucide-react";

export type RoleBookingTab = "rooms" | "analytics" | "heatmap";

export interface RoleBookingTabConfig {
  value: RoleBookingTab;
  label: string;
  icon: LucideIcon;
}

export const ROLE_BOOKING_TABS: RoleBookingTabConfig[] = [
  { value: "rooms", label: "Переговорные", icon: Building2 },
  { value: "analytics", label: "Аналитика", icon: BarChart3 },
  { value: "heatmap", label: "Пики занятости", icon: Calendar },
];

export const ROLE_BOOKING_TAB_TRIGGER_CLASS =
  "flex-shrink-0 whitespace-nowrap data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70";

export const ROLE_BOOKING_TABS_LIST_CLASS =
  "flex flex-nowrap flex-shrink-0 gap-1 min-w-0 bg-[#2C2C2E] border border-white/10 p-1";
