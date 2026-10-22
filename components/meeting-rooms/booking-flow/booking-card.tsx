"use client";

import { Building2, CalendarDays, MapPin, MessageSquare, QrCode, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MeetingRoomPhotoCarousel } from "@/components/meeting-rooms/meeting-room-photo-carousel";
import { getBookingStatusText } from "@/components/meeting-rooms/meeting-rooms-constants";
import type { MeetingRoomBooking } from "@/lib/api";
import { almatyDay, almatyMinutes, formatBookingDay, formatDuration, formatTime } from "@/lib/booking-flow";
import { cn } from "@/lib/utils";
import { EquipmentChips } from "./equipment-chips";

type CardTone = "desktop" | "mobile";

function roomOf(booking: MeetingRoomBooking) {
  return booking.meetingRoom ?? booking.meeting_room;
}

/** «Ср, 21 октября · 10:15–11:45 · 1 ч 30 мин». */
export function bookingWhen(booking: MeetingRoomBooking, withDuration = true) {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const span = `${formatTime(almatyMinutes(start))}–${formatTime(almatyMinutes(end))}`;
  const duration = Math.round((end.getTime() - start.getTime()) / 60000);
  return `${formatBookingDay(almatyDay(start))} · ${span}${withDuration && duration > 0 ? ` · ${formatDuration(duration)}` : ""}`;
}

export function isBookingActive(booking: MeetingRoomBooking) {
  return !["completed", "cancelled", "auto_cancelled"].includes(booking.status ?? "");
}

const CARD = {
  desktop: "border border-white/10 bg-[#1F1F21]",
  mobile: "border border-white/25 bg-white/15",
};

function Row({ icon: Icon, children, muted }: { icon: typeof CalendarDays; children: React.ReactNode; muted?: string }) {
  return (
    <p className="flex items-start gap-2 text-sm text-white/90">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/60" aria-hidden />
      <span className="min-w-0">
        {muted && <span className="text-white/60">{muted}: </span>}
        {children}
      </span>
    </p>
  );
}

/** Карточка в «Моих бронированиях»: время, офис, компания, пожелания, QR и отмена. */
export function BookingCard({
  booking,
  tone,
  onOpen,
  onQr,
  onCancel,
  cancelling,
  highlighted,
}: {
  booking: MeetingRoomBooking;
  tone: CardTone;
  onOpen: () => void;
  onQr: () => void;
  onCancel: () => void;
  cancelling: boolean;
  highlighted?: boolean;
}) {
  const room = roomOf(booking);
  const office = booking.office ?? room?.office;
  const active = isBookingActive(booking);
  return (
    <article
      className={cn("rounded-2xl p-4 transition-colors", CARD[tone], highlighted && "ring-2 ring-[#E85D2B]")}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left" aria-label={`Подробнее о брони: ${room?.name ?? "переговорная"}`}>
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-semibold text-white">{room?.name ?? `Комната #${booking.meeting_room_id}`}</h3>
          <span className="shrink-0 rounded-lg border border-white/30 bg-white/10 px-2 py-0.5 text-xs text-white/90">
            {getBookingStatusText(booking.status)}
          </span>
        </div>
        <div className="space-y-1.5">
          <Row icon={CalendarDays}>{bookingWhen(booking)}</Row>
          {office?.name && <Row icon={MapPin}>{office.name}</Row>}
          {booking.company_name && <Row icon={Building2} muted="Компания">{booking.company_name}</Row>}
          {booking.comment && <Row icon={MessageSquare} muted="Комментарий">{booking.comment}</Row>}
        </div>
      </button>
      {active && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onQr}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold",
              tone === "mobile" ? "bg-white/20 text-white hover:bg-white/30" : "bg-[#E85D2B] text-white hover:bg-[#D94F15]",
            )}
          >
            <QrCode className="h-4 w-4" /> QR-код
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className={cn(
              "h-10 rounded-xl text-sm font-semibold disabled:opacity-60",
              tone === "mobile" ? "border border-white/40 text-white hover:bg-white/10" : "bg-[#2C2C2E] text-white hover:bg-[#3A3A3C]",
            )}
          >
            {cancelling ? "Отмена…" : "Отменить"}
          </button>
        </div>
      )}
    </article>
  );
}

/** Детали брони: фото, время, место, компания, пожелания, оснащение; QR и отмена. */
export function BookingDetailsDialog({
  booking,
  onClose,
  onQr,
  onCancel,
  cancelling,
}: {
  booking: MeetingRoomBooking | null;
  onClose: () => void;
  onQr: () => void;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const room = booking ? roomOf(booking) : undefined;
  const office = booking ? booking.office ?? room?.office : undefined;
  const place = [office?.name, room?.floor != null ? `${room.floor} этаж` : null].filter(Boolean).join(" · ");
  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-[620px] gap-0 overflow-y-auto border-white/10 bg-[#1A1A1A] p-0 text-white [&>button]:hidden">
        <DialogTitle className="sr-only">{room?.name ?? "Бронь"}</DialogTitle>
        <DialogDescription className="sr-only">Детали брони переговорной</DialogDescription>
        {booking && (
          <>
            <div className="relative aspect-[16/6] overflow-hidden bg-[#2C2C2E]">
              <MeetingRoomPhotoCarousel photos={room?.photos} altPrefix={room?.name ?? "Переговорная"} darkTheme size="hero" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 hover:bg-black/80"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold">{room?.name ?? `Комната #${booking.meeting_room_id}`}</h2>
                <span className="shrink-0 rounded-lg border border-white/30 px-2 py-0.5 text-xs">{getBookingStatusText(booking.status)}</span>
              </div>
              <div className="space-y-2.5 text-[15px]">
                <Row icon={CalendarDays}>{bookingWhen(booking)}</Row>
                {place && <Row icon={MapPin}>{place}</Row>}
                {booking.company_name && <Row icon={Building2}>{booking.company_name}</Row>}
              </div>
              {booking.comment && (
                <p className="flex items-start gap-2 rounded-xl bg-[#3A2A22] px-4 py-3 text-sm">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#FF8A5B]" aria-hidden />
                  {booking.comment}
                </p>
              )}
              {room?.equipment?.length ? (
                <section>
                  <h3 className="mb-2 text-sm font-semibold">Оснащение</h3>
                  <EquipmentChips items={room.equipment} tone="desktop" />
                </section>
              ) : null}
              {isBookingActive(booking) && (
                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onQr}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#E85D2B] font-semibold hover:bg-[#D94F15]"
                  >
                    <QrCode className="h-5 w-5" /> Показать QR-код
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={cancelling}
                    className="h-12 rounded-2xl bg-[#3A1F1C] font-semibold text-[#FF8A7A] hover:bg-[#4A2622] disabled:opacity-60"
                  >
                    {cancelling ? "Отменяем…" : "Отменить бронь"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
