"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, QrCode } from "lucide-react";
import {
  cancelMeetingRoomBooking,
  type MeetingRoomBooking,
  type MyBookingsStatusFilter,
} from "@/lib/api";
import { formatDateOnly, formatTimeOnly } from "@/lib/dateTimeUtils";
import { useToast } from "@/hooks/use-toast";
import { useRejectRequestModal } from "@/hooks/use-reject-modal";
import { RejectRequestModal } from "@/components/requests";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMyBookings } from "@/hooks/use-my-bookings";
import { BookingCard, BookingDetailsDialog } from "./booking-flow/booking-card";
import {
  getBookingStatusText,
  MY_BOOKINGS_FILTERS,
} from "./meeting-rooms-constants";

interface MyBookingsProps {
  variant?: "default" | "dark" | "mobile";
}

export function MyBookings({ variant = "default" }: MyBookingsProps) {
  const isDark = variant === "dark";
  const isMobile = variant === "mobile";

  const [filter, setFilter] = useState<MyBookingsStatusFilter>("active");
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<MeetingRoomBooking | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [detail, setDetail] = useState<MeetingRoomBooking | null>(null);
  const { toast } = useToast();
  const rejectModal = useRejectRequestModal();
  const router = useRouter();

  const {
    activeList,
    completedList,
    cancelledList,
    activeHasMore,
    completedHasMore,
    cancelledHasMore,
    loading,
    loadingMore,
    loadMore,
    refresh,
  } = useMyBookings();

  const handleCancelClick = (booking: MeetingRoomBooking) => {
    setDetail(null);
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    const bookingId = bookingToCancel.id;
    setShowCancelModal(false);

    try {
      setCancellingId(bookingId);
      await cancelMeetingRoomBooking(bookingId);
      toast({
        title: "Бронирование отменено",
        description: "Бронирование успешно отменено",
      });
      await refresh();
    } catch (error: any) {
      console.error("Ошибка при отмене бронирования:", error);
      await refresh();
      rejectModal.showReject({
        title: "Ошибка отмены",
        message: error.response?.data?.message || "Ошибка при отмене бронирования",
      });
    } finally {
      setCancellingId(null);
      setBookingToCancel(null);
    }
  };

  const isBookingCancelled = (b: MeetingRoomBooking) =>
    b.status === "cancelled" || b.status === "auto_cancelled";
  const isBookingCompleted = (b: MeetingRoomBooking) => b.status === "completed";

  const handleOpenBookingPage = (bookingId: number) => {
    router.push(`/booking/${bookingId}`);
  };

  const currentList =
    filter === "active" ? activeList : filter === "completed" ? completedList : cancelledList;
  const currentHasMore =
    filter === "active" ? activeHasMore : filter === "completed" ? completedHasMore : cancelledHasMore;
  const activeCount = activeList.length;
  const completedCount = completedList.length;
  const cancelledCount = cancelledList.length;

  const emptyMessage =
    filter === "active"
      ? "Нет активных бронирований"
      : filter === "completed"
        ? "Нет завершённых бронирований"
        : "Нет отменённых бронирований";

  if (loading) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center space-y-4",
          isMobile ? "py-10" : "p-12 rounded-xl bg-[#1A1A1A] border border-[#3A3A3C]",
        )}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3A3A3C] border-t-[#E85D2B]" />
        <p className={cn("text-sm", isMobile ? "text-white/80" : "text-white/70")}>
          Загрузка ваших бронирований...
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-4",
        isMobile ? "" : "rounded-xl bg-[#1A1A1A] border border-[#3A3A3C] p-6",
      )}
    >
      <p className={cn("text-sm mb-4", isMobile ? "text-white/90" : "text-white/80")}>
        Управляйте своими бронированиями переговорных комнат
      </p>

      <div
        className={cn(
          "mb-6",
          isMobile ? "flex gap-2 overflow-x-auto pb-2" : "flex rounded-lg overflow-hidden bg-black/20",
        )}
      >
        {MY_BOOKINGS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "relative text-sm font-medium transition-colors",
              isMobile
                ? "px-4 py-2 rounded-[10px] whitespace-nowrap flex items-center gap-2"
                : "flex-1 py-2.5 text-center",
              !isMobile &&
                (filter === f.value
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white/90"),
              isMobile &&
                (filter === f.value
                  ? "bg-[#F35713] text-white"
                  : "bg-[#262626] text-[#7C7C7C]"),
            )}
          >
            {f.label}
            {!isMobile && f.value === "active" && activeCount > 0 && ` · ${activeCount}`}
            {isMobile && f.value === "active" && activeCount > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px]",
                  filter === f.value ? "bg-white/20" : "bg-white/10 text-white/80",
                )}
              >
                {activeCount}
              </span>
            )}
            {isMobile && f.value === "completed" && completedCount > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px]",
                  filter === f.value ? "bg-white/20" : "bg-white/10 text-white/80",
                )}
              >
                {completedCount}
              </span>
            )}
            {isMobile && f.value === "cancelled" && cancelledCount > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px]",
                  filter === f.value ? "bg-white/20" : "bg-white/10 text-white/80",
                )}
              >
                {cancelledCount}
              </span>
            )}
            {!isMobile && filter === f.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E85D2B]" />
            )}
          </button>
        ))}
      </div>

      <RejectRequestModal
        isOpen={rejectModal.isOpen}
        onClose={rejectModal.hideReject}
        title={rejectModal.title}
        message={rejectModal.message}
        duration={rejectModal.duration}
      />

      <BookingDetailsDialog
        booking={detail}
        onClose={() => setDetail(null)}
        onQr={() => detail && handleOpenBookingPage(detail.id)}
        onCancel={() => detail && handleCancelClick(detail)}
        cancelling={detail ? cancellingId === detail.id : false}
      />

      <DeleteConfirmationModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setBookingToCancel(null);
        }}
        onConfirm={handleCancelBooking}
        title="Отменить бронирование?"
        description={
          bookingToCancel
            ? `Вы уверены, что хотите отменить бронирование комнаты "${bookingToCancel.meetingRoom?.name || bookingToCancel.meeting_room?.name || `Комната #${bookingToCancel.meeting_room_id}`}" на ${formatDateOnly(bookingToCancel.start_time)} с ${formatTimeOnly(bookingToCancel.start_time)} до ${formatTimeOnly(bookingToCancel.end_time)}?`
            : "Вы уверены, что хотите отменить бронирование?"
        }
        confirmText="Отменить бронирование"
        cancelText="Нет, оставить"
        isLoading={cancellingId !== null && bookingToCancel?.id === cancellingId}
        variant="dark"
      />

      {currentList.length === 0 ? (
        <p className={cn("text-center py-8 text-sm", "text-white/70")}>{emptyMessage}</p>
      ) : (
        <div className={isMobile ? "space-y-4" : "grid gap-4 lg:grid-cols-2"}>
          {currentList.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              tone={isMobile ? "mobile" : "desktop"}
              onOpen={() => setDetail(booking)}
              onQr={() => handleOpenBookingPage(booking.id)}
              onCancel={() => handleCancelClick(booking)}
              cancelling={cancellingId === booking.id}
            />
          ))}
        </div>
      )}

      {currentList.length > 0 && currentHasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadMore(filter)}
            disabled={loadingMore === filter}
            className="border-white/30 text-white bg-transparent hover:bg-white/10"
          >
            {loadingMore === filter ? "Загрузка..." : "Загрузить ещё"}
          </Button>
        </div>
      )}
    </div>
  );
}
