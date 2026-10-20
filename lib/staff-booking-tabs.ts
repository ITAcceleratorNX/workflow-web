/** Вкладки раздела «Бронь» у персонала: Администратор, Офис-менеджер и Руководитель — один экран. */
export type StaffBookingTab = "book" | "my-bookings" | "bookings" | "rooms" | "analytics" | "heatmap";

export interface StaffBookingTabItem {
  value: StaffBookingTab;
  label: string;
}

/** Роли с общим экраном брони. */
export const STAFF_BOOKING_ROLES = ["admin-worker", "department-head", "manager"] as const;

/** Переговорные создают и редактируют только Администратор и Руководитель (бэкенд: /meeting-rooms). */
function canManageRooms(role: string | null | undefined): boolean {
  return role === "admin-worker" || role === "manager";
}

export function getStaffBookingTabs(role: string | null | undefined): StaffBookingTabItem[] {
  const tabs: StaffBookingTabItem[] = [
    { value: "book", label: "Забронировать" },
    { value: "my-bookings", label: "Мои бронирования" },
    // Офис-менеджер видит только свой офис, Администратор и Руководитель — все офисы.
    { value: "bookings", label: role === "department-head" ? "Бронирования офиса" : "Бронирования" },
  ];
  if (canManageRooms(role)) tabs.push({ value: "rooms", label: "Переговорные" });
  tabs.push({ value: "analytics", label: "Аналитика" }, { value: "heatmap", label: "Пики занятости" });
  return tabs;
}

export function getStaffBookingSubtitle(role: string | null | undefined): string {
  return role === "department-head"
    ? "Бронируйте переговорные и просматривайте бронирования своего офиса"
    : "Бронируйте переговорные и просматривайте бронирования всех офисов";
}
