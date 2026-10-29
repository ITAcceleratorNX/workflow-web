"use client";

import { useCallback, useState, type ReactNode } from "react";
import { ChevronLeft, Clock, Layers, Loader2, Users, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MeetingRoomPhotoCarousel } from "@/components/meeting-rooms/meeting-room-photo-carousel";
import { useToast } from "@/hooks/use-toast";
import type { MeetingRoomBooking } from "@/lib/api";
import { almatyDay, almatyMinutes, formatBookingDay, formatTime, officeHours } from "@/lib/booking-flow";
import { cn } from "@/lib/utils";
import { BookingDetailsStep } from "./booking-details-step";
import { BookingTimeStep } from "./booking-time-step";
import { BOOKING_TONE, type BookingTone } from "./booking-tone";
import { EquipmentChips } from "./equipment-chips";
import { useRoomBooking, type BookingRoomInfo } from "./use-room-booking";

export interface BookableRoom extends BookingRoomInfo {
  capacity?: number;
  description?: string | null;
  equipment?: string[];
}

type Office = BookingRoomInfo["office"] & { address?: string | null };

/** Тексты сообщения об успешной брони — общие для модалки и листа. */
function bookedToast(booking: MeetingRoomBooking) {
  const day = almatyDay(new Date(booking.start_time));
  const span = `${formatTime(almatyMinutes(booking.start_time))}–${formatTime(almatyMinutes(booking.end_time))}`;
  return { title: "Бронь создана", description: `${formatBookingDay(day)} · ${span}` };
}

function RoomMeta({ room, office, tone }: { room: BookableRoom; office?: Office | null; tone: BookingTone }) {
  const t = BOOKING_TONE[tone];
  const hours = officeHours(office ?? room.office);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm", tone === "mobile" ? "text-white" : "text-white/90")}>
      {room.capacity ? (
        <span className="inline-flex items-center gap-1.5">
          <Users className={cn("h-4 w-4", t.muted)} /> до {room.capacity} человек
        </span>
      ) : null}
      {room.floor != null && (
        <span className="inline-flex items-center gap-1.5">
          <Layers className={cn("h-4 w-4", t.muted)} /> {room.floor} этаж
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Clock className={cn("h-4 w-4", t.muted)} /> {formatTime(hours.start)}–{formatTime(hours.end)}
      </span>
    </div>
  );
}

/** Карточка переговорной перед бронью: фото, вместимость, часы, оснащение, описание. */
function RoomDetails({ room, office, tone }: { room: BookableRoom; office?: Office | null; tone: BookingTone }) {
  const t = BOOKING_TONE[tone];
  return (
    <div className="space-y-5">
      <RoomMeta room={room} office={office} tone={tone} />
      {room.equipment?.length ? (
        <section>
          <h3 className={cn("mb-2 text-xs font-semibold uppercase tracking-wide", t.muted)}>Оснащение</h3>
          <EquipmentChips items={room.equipment} tone={tone} />
        </section>
      ) : null}
      {room.description ? (
        <section>
          <h3 className={cn("mb-1.5 text-xs font-semibold uppercase tracking-wide", t.muted)}>Описание</h3>
          <p className="text-sm leading-relaxed text-white/90">{room.description}</p>
        </section>
      ) : null}
    </div>
  );
}

function subtitleFor(room: BookableRoom, office?: Office | null) {
  const officeName = office?.name ?? room.office?.name;
  return [officeName, room.floor != null ? `${room.floor} этаж` : null].filter(Boolean).join(" · ");
}

/** Двухшаговый сценарий: шапка с прогрессом, шаг, кнопки. */
function BookingFlow({
  room,
  tone,
  onBack,
  onClose,
  onBooked,
}: {
  room: BookableRoom;
  tone: BookingTone;
  onBack: () => void;
  onClose: () => void;
  onBooked: (booking: MeetingRoomBooking) => void;
}) {
  const t = BOOKING_TONE[tone];
  const state = useRoomBooking(room, { onBooked });
  const isTime = state.step === "time";

  const primary = isTime ? (
    <button
      type="button"
      onClick={() => state.setStep("details")}
      disabled={!state.canContinue}
      className={cn("h-12 rounded-2xl px-6 font-semibold transition-colors", t.primary, tone === "mobile" && "w-full")}
    >
      Далее
    </button>
  ) : (
    <button
      type="button"
      onClick={() => void state.submit()}
      disabled={!state.canSubmit}
      className={cn("inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-semibold transition-colors", t.primary, tone === "mobile" && "w-full")}
    >
      {state.submitting && <Loader2 className="h-4 w-4 animate-spin" />}
      {state.submitting ? "Бронируем…" : "Забронировать"}
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FlowHeader
        tone={tone}
        title="Бронирование"
        subtitle={`Шаг ${isTime ? 1 : 2} из 2 · ${isTime ? "время" : "детали"}${tone === "desktop" ? ` · ${room.name}` : ""}`}
        onBack={tone === "mobile" ? (isTime ? onBack : () => state.setStep("time")) : undefined}
        onClose={onClose}
      />
      <div className="mx-5 mb-4 grid grid-cols-2 gap-1.5" aria-hidden>
        <span className={cn("h-1 rounded-full", t.progressOn)} />
        <span className={cn("h-1 rounded-full", isTime ? t.progressOff : t.progressOn)} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        {isTime ? <BookingTimeStep state={state} tone={tone} /> : <BookingDetailsStep state={state} room={room} tone={tone} />}
      </div>
      <div className={cn("shrink-0 px-5 pb-5 pt-2", tone === "desktop" && "flex justify-end gap-3")}>
        {tone === "desktop" && (
          <button
            type="button"
            onClick={isTime ? onBack : () => state.setStep("time")}
            className={cn("h-12 rounded-2xl px-6 font-semibold", t.secondary)}
          >
            {isTime ? "Отмена" : "Назад"}
          </button>
        )}
        {primary}
      </div>
    </div>
  );
}

function FlowHeader({
  tone,
  title,
  subtitle,
  onBack,
  onClose,
}: {
  tone: BookingTone;
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  onClose?: () => void;
}) {
  const round = tone === "mobile" ? "bg-white/20 hover:bg-white/30" : "bg-[#2C2C2E] hover:bg-[#3A3A3C]";
  return (
    <div className="flex items-start gap-3 px-5 pb-4 pt-5">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Назад" className={cn("mt-0.5 rounded-full p-2 text-white", round)}>
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-bold leading-tight text-white">{title}</h2>
        {subtitle && <p className={cn("mt-0.5 text-sm", BOOKING_TONE[tone].muted)}>{subtitle}</p>}
      </div>
      {onClose && !(tone === "mobile" && onBack) && (
        <button type="button" onClick={onClose} aria-label="Закрыть" className={cn("rounded-full p-2 text-white", round)}>
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

interface RoomBookingProps {
  room: BookableRoom | null;
  office?: Office | null;
  onClose: () => void;
  /** После брони: например, переключить экран на «Мои бронирования». */
  onBooked?: (booking: MeetingRoomBooking) => void;
}

function useBookedHandler(onClose: () => void, onBooked?: (booking: MeetingRoomBooking) => void) {
  const { toast } = useToast();
  return useCallback(
    (booking: MeetingRoomBooking) => {
      toast({ ...bookedToast(booking), duration: 4000, variant: "success" });
      onClose();
      onBooked?.(booking);
    },
    [toast, onClose, onBooked],
  );
}

/** Desktop: модалка «карточка переговорной → время → детали». */
export function RoomBookingDialog({ room, office, onClose, onBooked }: RoomBookingProps) {
  const [stage, setStage] = useState<"room" | "flow">("room");
  const handleBooked = useBookedHandler(onClose, onBooked);
  const close = () => {
    setStage("room");
    onClose();
  };

  return (
    <Dialog open={!!room} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className={cn(
          "w-[95vw] gap-0 overflow-hidden border-white/10 bg-[#1A1A1A] p-0 text-white [&>button]:hidden",
          stage === "room" ? "max-w-[860px]" : "max-h-[92vh] max-w-[600px]",
        )}
      >
        <DialogTitle className="sr-only">{room?.name ?? "Бронирование"}</DialogTitle>
        <DialogDescription className="sr-only">Бронирование переговорной</DialogDescription>
        {room && stage === "room" && (
          <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#2C2C2E]">
              <MeetingRoomPhotoCarousel photos={room.photos} altPrefix={room.name} darkTheme size="hero" />
            </div>
            <div className="flex min-h-0 flex-col">
              <div className="mb-4 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-white">{room.name}</h2>
                  <p className="text-sm text-[#8E8E93]">{subtitleFor(room, office)}</p>
                </div>
                <button type="button" onClick={close} aria-label="Закрыть" className="rounded-full bg-[#2C2C2E] p-2 hover:bg-[#3A3A3C]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <RoomDetails room={room} office={office} tone="desktop" />
              <button
                type="button"
                onClick={() => setStage("flow")}
                className="mt-6 h-12 rounded-2xl bg-[#E85D2B] font-semibold text-white hover:bg-[#D94F15] md:mt-auto"
              >
                Выбрать время
              </button>
            </div>
          </div>
        )}
        {room && stage === "flow" && (
          <BookingFlow room={room} tone="desktop" onBack={() => setStage("room")} onClose={close} onBooked={handleBooked} />
        )}
      </DialogContent>
    </Dialog>
  );
}

const MOBILE_GRADIENT = "linear-gradient(180deg, #F35713 0%, #9A3A0E 55%, #281504 100%)";

/** Mobile: полноэкранный лист на оранжевом градиенте (как в приложении). */
export function RoomBookingSheet({ room, office, onClose, onBooked }: RoomBookingProps) {
  const [stage, setStage] = useState<"room" | "flow">("room");
  const handleBooked = useBookedHandler(onClose, onBooked);
  if (!room) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={room.name}
      className="fixed inset-0 z-[60] flex flex-col text-white"
      style={{ background: MOBILE_GRADIENT, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {stage === "room" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <FlowHeader tone="mobile" title={room.name} subtitle={subtitleFor(room, office)} onBack={onClose} />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
            <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl bg-black/20">
              <MeetingRoomPhotoCarousel photos={room.photos} altPrefix={room.name} darkTheme size="hero" />
            </div>
            <RoomDetails room={room} office={office} tone="mobile" />
          </div>
          <div className="shrink-0 px-5 pb-5 pt-2">
            <button
              type="button"
              onClick={() => setStage("flow")}
              className="h-12 w-full rounded-2xl bg-white font-semibold text-[#E85D2B] hover:bg-white/90"
            >
              Выбрать время
            </button>
          </div>
        </div>
      ) : (
        <BookingFlow room={room} tone="mobile" onBack={() => setStage("room")} onClose={onClose} onBooked={handleBooked} />
      )}
    </div>
  );
}
