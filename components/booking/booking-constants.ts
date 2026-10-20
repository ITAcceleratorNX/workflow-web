import type { LucideIcon } from "lucide-react";
import { BarChart3, Building2, Calendar, CalendarCheck, CalendarPlus, ListChecks } from "lucide-react";
import type { StaffBookingTab } from "@/lib/staff-booking-tabs";

export const STAFF_BOOKING_TAB_ICONS: Record<StaffBookingTab, LucideIcon> = {
  book: CalendarPlus,
  "my-bookings": ListChecks,
  bookings: CalendarCheck,
  rooms: Building2,
  analytics: BarChart3,
  heatmap: Calendar,
};

export const ROLE_BOOKING_TAB_TRIGGER_CLASS =
  "flex-shrink-0 whitespace-nowrap data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70";

/** Ширина по вкладкам, но не уже контейнера: при нехватке места список прокручивается целиком. */
export const ROLE_BOOKING_TABS_LIST_CLASS =
  "flex flex-nowrap flex-shrink-0 gap-1 w-max min-w-full bg-[#2C2C2E] border border-white/10 p-1";
