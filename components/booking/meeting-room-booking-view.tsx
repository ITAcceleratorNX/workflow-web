"use client";

import FullScreenLoading from "@/components/FullScreenLoading";
import { BookingModal } from "@/components/meeting-rooms/BookingModal";
import { useMeetingRoomBookingPage } from "@/hooks/use-meeting-room-booking-page";

/** Mobile booking flow — `/meeting-rooms/booking?roomId=`. */
export function MeetingRoomBookingView() {
  const { room, loading, handleClose } = useMeetingRoomBookingPage();

  if (loading) {
    return <FullScreenLoading />;
  }

  if (!room) {
    return null;
  }

  return (
    <BookingModal
      isOpen={true}
      onClose={handleClose}
      room={room}
      isPageMode={true}
    />
  );
}
