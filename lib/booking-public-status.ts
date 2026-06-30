import type { MeetingRoomBooking } from "@/lib/api";

export type PublicBookingStatus = "confirmed" | "expired" | "cancelled";

export function getPublicBookingStatus(booking: MeetingRoomBooking): PublicBookingStatus {
  const status = booking.status;
  if (status === "cancelled" || status === "auto_cancelled") {
    return "cancelled";
  }
  if (status === "completed") {
    return "expired";
  }
  const endTime = new Date(booking.end_time);
  if (!Number.isNaN(endTime.getTime()) && endTime < new Date()) {
    return "expired";
  }
  return "confirmed";
}

export function getPublicBookingStatusLabel(status: PublicBookingStatus): string {
  switch (status) {
    case "confirmed":
      return "Подтверждена";
    case "expired":
      return "Истекла";
    case "cancelled":
      return "Отменена";
  }
}

export function getRoomPhotos(booking: MeetingRoomBooking): string[] {
  const room = booking.meetingRoom || booking.meeting_room;
  if (!room) return [];
  const photos = (room as { photos?: string[] }).photos;
  return Array.isArray(photos) ? photos.filter(Boolean) : [];
}

export function getBookerDisplayName(booking: MeetingRoomBooking): string | null {
  if (booking.company_name?.trim()) {
    return booking.company_name.trim();
  }
  const client = (booking as { client?: { full_name?: string | null } }).client;
  if (client?.full_name?.trim()) {
    return client.full_name.trim();
  }
  return null;
}
