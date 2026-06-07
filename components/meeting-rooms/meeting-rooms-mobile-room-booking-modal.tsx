"use client";

import Image from "next/image";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  X,
  Building2,
  Users,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { MeetingRoomBookingCalendar } from "@/components/meeting-rooms/meeting-room-booking-calendar";
import { MEETING_ROOM_TIME_SLOTS } from "@/lib/meeting-room-time-slots";
import type { MeetingRoom, Office } from "@/lib/api";
import type { UseMeetingRoomsMobilePageResult } from "@/hooks/use-meeting-rooms-mobile-page";

interface MeetingRoomsMobileRoomBookingModalProps {
  office: Office | null;
  room: MeetingRoom;
  page: Pick<
    UseMeetingRoomsMobilePageResult,
    | "selectedDate"
    | "selectedTimeSlot"
    | "setSelectedTimeSlot"
    | "bookingComment"
    | "setBookingComment"
    | "isBooking"
    | "bookedSlots"
    | "loadingAvailability"
    | "currentMonth"
    | "setCurrentMonth"
    | "showCalendar"
    | "setShowCalendar"
    | "photoIndex"
    | "setPhotoIndex"
    | "closeRoomModal"
    | "handleBookRoom"
    | "selectCalendarDate"
    | "getDaysInMonth"
    | "getFirstDayOfMonth"
    | "isSlotDisabled"
  >;
}

export function MeetingRoomsMobileRoomBookingModal({
  office,
  room,
  page,
}: MeetingRoomsMobileRoomBookingModalProps) {
  const {
    selectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    bookingComment,
    setBookingComment,
    isBooking,
    bookedSlots,
    loadingAvailability,
    currentMonth,
    setCurrentMonth,
    showCalendar,
    setShowCalendar,
    photoIndex,
    setPhotoIndex,
    closeRoomModal,
    handleBookRoom,
    selectCalendarDate,
    getDaysInMonth,
    getFirstDayOfMonth,
    isSlotDisabled,
  } = page;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: "linear-gradient(169.92deg, #F35713 -3.47%, #281504 104.23%)" }}
    >
      <div className="flex flex-col h-full pt-9 px-3 pb-24 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-white">{office?.name}</h2>
          <button type="button" onClick={closeRoomModal} className="p-1">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="w-full h-[185px] bg-white/20 rounded-[10px] overflow-hidden relative mb-4">
          {room.photos && room.photos.length > 0 ? (
            <>
              <div className="relative w-full h-full">
                <Image
                  src={room.photos[photoIndex]}
                  alt={`${room.name} — фото ${photoIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 100%"
                  priority
                />
              </div>
              {room.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoIndex((i) => (i === 0 ? room.photos.length - 1 : i - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-0 flex items-center justify-center z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoIndex((i) => (i === room.photos.length - 1 ? 0 : i + 1));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-0 flex items-center justify-center z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-xs font-medium text-white z-10">
                    {photoIndex + 1} / {room.photos.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex flex-col items-center justify-center gap-2">
              <ImageIcon className="w-12 h-12 text-white/40" />
              <span className="text-sm text-white/40">Фото не загружено</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-base font-medium text-white mb-2">{room.name}</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#C1C1C1]" />
              <span className="text-xs text-[#C1C1C1]">{room.floor} этаж</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-[#C1C1C1]" />
              <span className="text-xs text-[#C1C1C1]">до {room.capacity} человек</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-base font-medium text-white mb-2 block">Дата</label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full bg-[#953F15] rounded-[10px] px-4 py-3 text-left flex items-center justify-between"
            >
              <span className={selectedDate ? "text-white text-sm" : "text-[#D1D1D1] text-sm"}>
                {selectedDate
                  ? format(selectedDate, "dd MMMM yyyy", { locale: ru })
                  : "Выберите дату"}
              </span>
              <ChevronRight
                className={`w-4 h-4 text-[#D1D1D1] transition-transform ${showCalendar ? "rotate-90" : ""}`}
              />
            </button>

            {showCalendar && (
              <MeetingRoomBookingCalendar
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                onMonthChange={setCurrentMonth}
                onSelectDate={selectCalendarDate}
                getDaysInMonth={getDaysInMonth}
                getFirstDayOfMonth={getFirstDayOfMonth}
              />
            )}
          </div>

          {selectedDate && (
            <div>
              <label className="text-base font-medium text-white mb-2 block">Время</label>
              {loadingAvailability ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-sm text-white/60">Загрузка...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {MEETING_ROOM_TIME_SLOTS.map((slot) => {
                    const isDisabled = isSlotDisabled(slot.start);
                    const isBooked = bookedSlots.has(slot.start);
                    const isSelected = selectedTimeSlot === slot.label;

                    return (
                      <button
                        key={slot.label}
                        type="button"
                        onClick={() => !isDisabled && setSelectedTimeSlot(slot.label)}
                        disabled={isDisabled}
                        className={`
                          flex items-center justify-between px-3 py-3 rounded-[10px] text-sm font-medium transition-all
                          ${isDisabled ? "bg-[#953F15]/30 text-white/30 cursor-not-allowed" : "bg-[#953F15] text-white"}
                          ${isSelected ? "bg-[#F35713] ring-2 ring-white" : ""}
                          ${isBooked && !isSelected ? "bg-red-900/40 text-red-300" : ""}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{slot.label}</span>
                        </div>
                        {isBooked && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/30 text-red-200">
                            Занято
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedDate && selectedTimeSlot && (
            <div className="flex items-center gap-2 p-3 bg-white/10 rounded-[10px]">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-sm text-white">
                {format(selectedDate, "dd MMMM yyyy", { locale: ru })} • {selectedTimeSlot}
              </span>
            </div>
          )}

          <div>
            <label className="text-base font-medium text-white mb-2 block">
              Название компании (необязательно)
            </label>
            <textarea
              value={bookingComment}
              onChange={(e) => setBookingComment(e.target.value)}
              placeholder="Название компании"
              className="w-full bg-[#953F15] rounded-[10px] px-4 py-3 text-white text-sm placeholder-[#D1D1D1] focus:outline-none min-h-[73px] resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleBookRoom}
            disabled={!selectedDate || !selectedTimeSlot || isBooking}
            className="w-full bg-[#F35713] text-white py-4 rounded-[10px] font-medium text-base disabled:opacity-50"
          >
            {isBooking ? "Бронирование..." : "Забронировать"}
          </button>
        </div>
      </div>
    </div>
  );
}
