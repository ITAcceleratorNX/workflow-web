import { format } from "date-fns";

interface AvailabilityBooking {
  start_time: string;
  end_time: string;
}

interface AvailabilitySlot {
  start_time?: string;
  is_available?: boolean;
}

/** Парсит занятые почасовые слоты из ответа getRoomDailyAvailability. */
export function parseBookedHourSlots(
  dateString: string,
  bookings?: AvailabilityBooking[],
  slots?: AvailabilitySlot[],
): Set<string> {
  const booked = new Set<string>();

  if (bookings && Array.isArray(bookings)) {
    bookings.forEach((booking) => {
      const bookingDateFromString = booking.start_time.substring(0, 10);
      if (bookingDateFromString === dateString) {
        const startHour = parseInt(booking.start_time.substring(11, 13), 10);
        const endHour = parseInt(booking.end_time.substring(11, 13), 10);
        for (let h = startHour; h < endHour; h++) {
          booked.add(`${h.toString().padStart(2, "0")}:00`);
        }
      }
    });
  }

  if (slots && Array.isArray(slots)) {
    slots.forEach((slot) => {
      if (!slot.is_available && slot.start_time) {
        const slotDateStr = slot.start_time.substring(0, 10);
        if (slotDateStr === dateString) {
          const hour = slot.start_time.substring(11, 13).padStart(2, "0");
          booked.add(`${hour}:00`);
        }
      }
    });
  }

  return booked;
}

export function formatDateForAvailability(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
