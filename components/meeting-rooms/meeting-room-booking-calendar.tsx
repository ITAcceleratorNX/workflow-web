"use client";

import {
  addMonths,
  format,
  isBefore,
  isSameDay,
  isToday,
  startOfDay,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MeetingRoomBookingCalendarProps {
  currentMonth: Date;
  selectedDate: Date | null;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  getDaysInMonth: (date: Date) => Date[];
  getFirstDayOfMonth: (date: Date) => number;
}

/** Inline-календарь для mobile booking flow (RN parity). */
export function MeetingRoomBookingCalendar({
  currentMonth,
  selectedDate,
  onMonthChange,
  onSelectDate,
  getDaysInMonth,
  getFirstDayOfMonth,
}: MeetingRoomBookingCalendarProps) {
  return (
    <div className="mt-2 bg-[#1C1C1E] rounded-[10px] p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="p-2 text-white hover:bg-white/10 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white font-medium">
          {format(currentMonth, "LLLL yyyy", { locale: ru })}
        </span>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="p-2 text-white hover:bg-white/10 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
          <div key={day} className="text-center text-xs text-[#C1C1C1] py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}

        {getDaysInMonth(currentMonth).map((day) => {
          const isPast = isBefore(day, startOfDay(new Date()));
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => {
                if (!isPast) onSelectDate(day);
              }}
              disabled={isPast}
              className={`
                h-10 rounded-lg text-sm font-medium transition-all
                ${isPast ? "text-gray-600 cursor-not-allowed" : "text-white hover:bg-white/10"}
                ${isSelected ? "bg-[#F35713] hover:bg-[#F35713]" : ""}
                ${isTodayDate && !isSelected ? "border border-[#F35713]" : ""}
              `}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
