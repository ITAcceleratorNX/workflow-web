export interface MeetingRoomTimeSlot {
  label: string;
  start: string;
  end: string;
}

/** Слоты бронирования 9:00–24:00 (почасово). */
export function generateMeetingRoomTimeSlots(): MeetingRoomTimeSlot[] {
  const slots: MeetingRoomTimeSlot[] = [];
  for (let hour = 9; hour < 24; hour++) {
    const startHour = hour.toString().padStart(2, "0");
    const endHour = (hour + 1).toString().padStart(2, "0");
    slots.push({
      label: `${startHour}:00-${endHour}:00`,
      start: `${startHour}:00`,
      end: `${endHour}:00`,
    });
  }
  return slots;
}

export const MEETING_ROOM_TIME_SLOTS = generateMeetingRoomTimeSlots();
