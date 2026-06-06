import type { MeetingRoom } from "@/stores/meetingRoomsStore";
import type { MeetingRoom as ApiMeetingRoom, MyBookingsStatusFilter, Office } from "@/lib/api";

export type MeetingRoomsMobileSubTab = "offices" | "rooms" | "calculator";
export type MeetingRoomsMobileTab = "book" | "my-bookings";

export const MEETING_ROOMS_MOBILE_SUB_TABS: { key: MeetingRoomsMobileSubTab; label: string }[] = [
  { key: "offices", label: "Офисы" },
  { key: "rooms", label: "Свободные комнаты" },
  { key: "calculator", label: "Калькулятор высоты стола" },
];

export const GUEST_DEMO_OFFICES: Office[] = [
  { id: 1, name: "Офис (демо)", address: "ул. Демо, 1", city: "Алматы" },
];

export const GUEST_DEMO_ROOMS: ApiMeetingRoom[] = [
  {
    id: 1,
    name: "Переговорная 1 (демо)",
    floor: 1,
    capacity: 6,
    photos: [],
    status: "available",
    isActive: true,
    office_id: 1,
  },
];

export const MEETING_ROOM_STATUS_LABELS: Record<MeetingRoom["status"], string> = {
  available: "Доступна",
  booked: "Забронирована",
};

export const MEETING_ROOM_STATUS_BADGE_CLASSES: Record<MeetingRoom["status"], string> = {
  available:
    "bg-gradient-to-r from-[#114A65] to-[#114A65]/90 text-white backdrop-blur-md border border-[#114A65]/50 shadow-lg font-bold",
  booked:
    "bg-gradient-to-r from-[#B8400E] to-[#B8400E]/90 text-white backdrop-blur-md border border-[#B8400E]/50 shadow-lg font-bold",
};

export const MY_BOOKINGS_PAGE_SIZE = 20;

export const MY_BOOKINGS_FILTERS: { value: MyBookingsStatusFilter; label: string }[] = [
  { value: "active", label: "Активные" },
  { value: "completed", label: "Завершенные" },
  { value: "cancelled", label: "Отменённые" },
];

export function getBookingStatusText(status?: string): string {
  switch (status) {
    case "scheduled":
      return "Запланировано";
    case "in_progress":
      return "В процессе";
    case "completed":
      return "Завершено";
    case "cancelled":
    case "auto_cancelled":
      return "Отменено";
    case "confirmed":
      return "Подтверждено";
    default:
      return "Активно";
  }
}
