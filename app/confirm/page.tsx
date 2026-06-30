"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  User,
  ImageIcon,
  ShieldCheck,
} from "lucide-react";
import { getPublicBooking, type MeetingRoomBooking } from "@/lib/api";
import { formatDateOnly, formatTimeOnly } from "@/lib/dateTimeUtils";
import {
  getBookerDisplayName,
  getPublicBookingStatus,
  getPublicBookingStatusLabel,
  getRoomPhotos,
  type PublicBookingStatus,
} from "@/lib/booking-public-status";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<PublicBookingStatus, string> = {
  confirmed: "bg-[#F35713]/15 text-[#F35713] border-[#F35713]/40",
  expired: "bg-white/5 text-white/50 border-white/10",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
};

function ConfirmPageContent() {
  const searchParams = useSearchParams();
  const bookingIdParam = searchParams.get("id") ?? searchParams.get("bookingId");
  const bookingId = bookingIdParam ? parseInt(bookingIdParam, 10) : NaN;

  const [booking, setBooking] = useState<MeetingRoomBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingIdParam || Number.isNaN(bookingId)) {
      setError("Неверная ссылка подтверждения");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const response = await getPublicBooking(bookingId);
        setBooking(response.data);
      } catch (err: unknown) {
        console.error("Ошибка загрузки бронирования:", err);
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        const apiMessage = axiosErr.response?.data?.message;
        const message =
          axiosErr.response?.status === 404
            ? "Бронирование не найдено"
            : apiMessage || "Не удалось загрузить информацию о бронировании";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, bookingIdParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1C1C1E] rounded-[10px] p-8 text-center">
          <div className="w-12 h-12 border-2 border-[#F35713] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-white/60">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1C1C1E] rounded-[10px] p-8 text-center space-y-3">
          <ShieldCheck className="h-10 w-10 text-[#F35713] mx-auto opacity-60" />
          <p className="text-white font-semibold text-lg">Подтверждение брони</p>
          <p className="text-red-400 text-sm">{error || "Бронирование не найдено"}</p>
        </div>
      </div>
    );
  }

  const office = booking.office || booking.meetingRoom?.office || booking.meeting_room?.office;
  const room = booking.meetingRoom || booking.meeting_room;
  const photos = getRoomPhotos(booking);
  const publicStatus = getPublicBookingStatus(booking);
  const statusLabel = getPublicBookingStatusLabel(publicStatus);
  const bookerName = getBookerDisplayName(booking);

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto w-full max-w-lg px-4 pt-10 pb-10">
        <div className="mb-6 text-center">
          <p className="text-[#F35713] text-sm font-semibold tracking-wide uppercase">WorkFlow</p>
          <h1 className="mt-1 text-xl font-bold text-white">Подтверждение брони</h1>
        </div>

        <div className="overflow-hidden rounded-[10px] bg-[#1C1C1E] border border-white/5">
          <div className="relative aspect-[16/10] bg-[#2C2C2E]">
            {photos.length > 0 ? (
              <img
                src={photos[0]}
                alt={room?.name ? `Фото: ${room.name}` : "Фото переговорной"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#8E8E93]">
                <ImageIcon className="h-10 w-10" />
                <span className="text-sm">Переговорная комната</span>
              </div>
            )}
            <div
              className={cn(
                "absolute top-3 right-3 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm",
                STATUS_STYLES[publicStatus],
              )}
            >
              {statusLabel}
            </div>
          </div>

          <div className="space-y-4 p-4">
            {office && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-[#F35713] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-white/50 mb-0.5">Бизнес-центр / офис</p>
                  <p className="font-semibold text-white">{office.name}</p>
                  {office.address && (
                    <div className="mt-1 flex items-start gap-1.5 text-sm text-white/60">
                      <MapPin className="h-3.5 w-3.5 text-[#F35713] mt-0.5 shrink-0" />
                      <span>{office.address}</span>
                    </div>
                  )}
                  {office.city && (
                    <p className="text-sm text-white/40 mt-0.5">{office.city}</p>
                  )}
                </div>
              </div>
            )}

            {room && (
              <div className="flex items-start gap-3 pt-1 border-t border-white/10">
                <Building2 className="h-5 w-5 text-[#F35713] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-white/50 mb-0.5">Переговорная</p>
                  <p className="font-semibold text-white">{room.name}</p>
                  {room.floor != null && (
                    <p className="text-sm text-white/50 mt-0.5">Этаж {room.floor}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 pt-1 border-t border-white/10">
              <Calendar className="h-5 w-5 text-[#F35713] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-white/50 mb-0.5">Дата</p>
                <p className="font-semibold text-white">{formatDateOnly(booking.start_time)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-[#F35713] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-white/50 mb-0.5">Время</p>
                <p className="font-semibold text-white">
                  {formatTimeOnly(booking.start_time)} – {formatTimeOnly(booking.end_time)}
                </p>
              </div>
            </div>

            {bookerName && (
              <div className="flex items-start gap-3 pt-1 border-t border-white/10">
                <User className="h-5 w-5 text-[#F35713] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-white/50 mb-0.5">
                    {booking.company_name?.trim() ? "Компания" : "Бронирующий"}
                  </p>
                  <p className="font-semibold text-white">{bookerName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Данные актуальны на момент просмотра
        </p>
      </div>
    </div>
  );
}

export default function BookingConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1C1C1E] rounded-[10px] p-8 text-center">
            <div className="w-12 h-12 border-2 border-[#F35713] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-white/60">Загрузка...</p>
          </div>
        </div>
      }
    >
      <ConfirmPageContent />
    </Suspense>
  );
}
