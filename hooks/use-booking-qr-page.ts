"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicBooking, type MeetingRoomBooking } from "@/lib/api";
import { useGuestDemoStore } from "@/stores/useGuestDemoStore";

function mapGuestBookingToApi(
  guest: ReturnType<typeof useGuestDemoStore.getState>["guestBookings"][number],
): MeetingRoomBooking {
  return {
    id: guest.id,
    meeting_room_id: guest.meeting_room_id,
    start_time: guest.start_time,
    end_time: guest.end_time,
    status: guest.status,
    company_name: guest.company_name ?? null,
    meeting_room: guest.meeting_room
      ? { id: guest.meeting_room.id, name: guest.meeting_room.name }
      : undefined,
    meetingRoom: guest.meeting_room
      ? { id: guest.meeting_room.id, name: guest.meeting_room.name }
      : undefined,
  } as MeetingRoomBooking;
}

export function useBookingQrPage() {
  const params = useParams();
  const guestBookings = useGuestDemoStore((s) => s.guestBookings);
  const [booking, setBooking] = useState<MeetingRoomBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = params?.bookingId ? parseInt(params.bookingId as string, 10) : null;

  useEffect(() => {
    if (!bookingId || Number.isNaN(bookingId)) {
      setError("Неверный ID бронирования");
      setLoading(false);
      return;
    }

    if (bookingId < 0) {
      const guestBooking = guestBookings.find((b) => b.id === bookingId);
      if (guestBooking) {
        setBooking(mapGuestBookingToApi(guestBooking));
      } else {
        setError("Бронирование не найдено (демо)");
      }
      setLoading(false);
      return;
    }

    let cancelled = false;

    getPublicBooking(bookingId)
      .then((response) => {
        if (!cancelled) setBooking(response.data);
      })
      .catch((err: unknown) => {
        console.error("Ошибка загрузки бронирования:", err);
        if (!cancelled) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || "Не удалось загрузить информацию о бронировании";
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId, guestBookings]);

  return { booking, loading, error, bookingId };
}

export type UseBookingQrPageResult = ReturnType<typeof useBookingQrPage>;
