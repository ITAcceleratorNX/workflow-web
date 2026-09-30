import { format } from "date-fns";

interface AvailabilityBooking {
  start_time: string | Date;
  end_time: string | Date;
}

interface AvailabilitySlot extends AvailabilityBooking {
  is_available: boolean;
}

/** Matches the booking API's date/time contract (Kazakhstan, UTC+05:00). */
export const BOOKING_UTC_OFFSET = "+05:00";
const HOUR_MS = 60 * 60 * 1000;

export function bookingHourStart(dateString: string, hour: string): number {
  return new Date(`${dateString}T${hour}:00${BOOKING_UTC_OFFSET}`).getTime();
}

function bookingTimestamp(value: string | Date): number {
  if (value instanceof Date) return value.getTime();
  // Legacy local timestamp strings use the same zone as booking form submissions.
  const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}${BOOKING_UTC_OFFSET}`;
  return new Date(withZone).getTime();
}

/** Mark every hourly slot intersecting a booking/unavailable interval in the selected API day. */
export function parseBookedHourSlots(
  dateString: string,
  bookings: AvailabilityBooking[] = [],
  slots: AvailabilitySlot[] = [],
): Set<string> {
  const dayStart = bookingHourStart(dateString, "00:00");
  if (!Number.isFinite(dayStart)) throw new Error("Некорректная дата бронирования");
  const blockedIntervals = [
    ...bookings,
    ...slots.filter((slot) => slot.is_available === false),
  ].map((interval) => {
    const start = bookingTimestamp(interval.start_time);
    const end = bookingTimestamp(interval.end_time);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new Error("Сервер вернул некорректные интервалы доступности");
    }
    return { start, end };
  });
  const booked = new Set<string>();
  for (let hour = 0; hour < 24; hour += 1) {
    const start = dayStart + hour * HOUR_MS;
    const end = start + HOUR_MS;
    if (blockedIntervals.some((interval) => interval.start < end && interval.end > start)) {
      booked.add(`${String(hour).padStart(2, "0")}:00`);
    }
  }
  return booked;
}

export function formatDateForAvailability(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
