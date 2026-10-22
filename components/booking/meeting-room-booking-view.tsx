"use client";

import FullScreenLoading from "@/components/FullScreenLoading";
import { RoomBookingSheet } from "@/components/meeting-rooms/booking-flow/room-booking";
import { useMeetingRoomBookingPage } from "@/hooks/use-meeting-room-booking-page";

/** Страница брони по ссылке `/meeting-rooms/booking?roomId=` — тот же сценарий, что и в каталоге. */
export function MeetingRoomBookingView() {
  const { room, loading, handleClose } = useMeetingRoomBookingPage();

  if (loading) {
    return <FullScreenLoading />;
  }

  return <RoomBookingSheet room={room} office={room?.office} onClose={handleClose} onBooked={handleClose} />;
}
