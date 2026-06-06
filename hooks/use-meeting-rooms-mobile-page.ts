"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  format,
} from "date-fns";
import {
  getMeetingRooms,
  getRoomDailyAvailability,
  type MeetingRoom,
  type Office,
} from "@/lib/api";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGuestDemoStore } from "@/stores/useGuestDemoStore";
import { useToast } from "@/hooks/use-toast";
import { MEETING_ROOM_TIME_SLOTS } from "@/lib/meeting-room-time-slots";
import {
  formatDateForAvailability,
  parseBookedHourSlots,
} from "@/lib/meeting-room-availability";
import {
  GUEST_DEMO_OFFICES,
  GUEST_DEMO_ROOMS,
  type MeetingRoomsMobileSubTab,
  type MeetingRoomsMobileTab,
} from "@/components/meeting-rooms/meeting-rooms-constants";

export function useMeetingRoomsMobilePage() {
  const router = useRouter();
  const isGuest = useAuthStore((s) => s.isGuest);
  const { toast } = useToast();
  const { addGuestBooking } = useGuestDemoStore();

  const [activeTab, setActiveTab] = useState<MeetingRoomsMobileTab>("book");
  const [activeSubTab, setActiveSubTab] = useState<MeetingRoomsMobileSubTab>("offices");
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [bookingComment, setBookingComment] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const fetchOffices = useCallback(async () => {
    try {
      if (isGuest) {
        setOffices(GUEST_DEMO_OFFICES);
        return;
      }
      const response = await api.get("/offices");
      setOffices(response.data || []);
    } catch (error) {
      console.error("Error fetching offices:", error);
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  const fetchRooms = useCallback(
    async (officeId: number) => {
      setLoadingRooms(true);
      try {
        if (isGuest) {
          setRooms(GUEST_DEMO_ROOMS);
          return;
        }
        const response = await getMeetingRooms(officeId);
        const activeRooms = (response.data || []).filter((room) => room.isActive);
        setRooms(activeRooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    },
    [isGuest],
  );

  useEffect(() => {
    if (!selectedDate || !selectedRoom) {
      setBookedSlots(new Set());
      return;
    }
    if (isGuest) {
      setBookedSlots(new Set());
      return;
    }

    const dateString = formatDateForAvailability(selectedDate);
    setLoadingAvailability(true);

    getRoomDailyAvailability(selectedRoom.id, dateString, 60)
      .then((response) => {
        setBookedSlots(
          parseBookedHourSlots(
            dateString,
            response.data.bookings,
            response.data.slots,
          ),
        );
      })
      .catch(() => setBookedSlots(new Set()))
      .finally(() => setLoadingAvailability(false));
  }, [selectedDate, selectedRoom, isGuest]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [selectedRoom?.id]);

  const handleOfficeClick = (office: Office) => {
    setSelectedOffice(office);
    fetchRooms(office.id);
  };

  const handleRoomClick = (room: MeetingRoom) => {
    setSelectedRoom(room);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setBookedSlots(new Set());
  };

  const handleBookRoom = async () => {
    if (!selectedRoom || !selectedDate || !selectedTimeSlot) return;

    const timeSlot = MEETING_ROOM_TIME_SLOTS.find((slot) => slot.label === selectedTimeSlot);
    if (!timeSlot) return;

    const now = new Date();
    const isDateToday = isSameDay(selectedDate, now);
    const slotDateTime = new Date(selectedDate);
    const [hour] = timeSlot.start.split(":");
    slotDateTime.setHours(parseInt(hour, 10), 0, 0, 0);

    if (isDateToday && slotDateTime < now) {
      alert("Нельзя бронировать время, которое уже прошло");
      return;
    }

    setIsBooking(true);
    try {
      if (isGuest && selectedRoom) {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const startTime = `${dateStr}T${timeSlot.start}:00`;
        const endTime = `${dateStr}T${timeSlot.end}:00`;
        const newBookingId = addGuestBooking({
          meeting_room_id: selectedRoom.id,
          start_time: startTime,
          end_time: endTime,
          status: "scheduled",
          company_name: bookingComment || null,
          meeting_room: { id: selectedRoom.id, name: selectedRoom.name },
        });
        toast({ title: "Демо", description: "Бронирование создано локально" });
        resetBookingForm();
        setActiveTab("my-bookings");
        router.push(`/booking/${newBookingId}`);
        return;
      }

      const response = await api.post("/meeting-room-bookings", {
        meeting_room_id: selectedRoom.id,
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: `${timeSlot.start}:00`,
        end_time: `${timeSlot.end}:00`,
        company_name: bookingComment || null,
      });

      resetBookingForm();
      router.push(`/booking/${response.data.id}`);
    } catch (error: unknown) {
      console.error("Error booking room:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка при бронировании";
      alert(errorMessage);
    } finally {
      setIsBooking(false);
    }
  };

  const resetBookingForm = () => {
    setSelectedRoom(null);
    setSelectedOffice(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setBookingComment("");
  };

  const closeOfficeModal = () => {
    setSelectedOffice(null);
    setRooms([]);
  };

  const closeRoomModal = () => {
    setSelectedRoom(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setPhotoIndex(0);
  };

  const selectCalendarDate = (day: Date) => {
    setSelectedDate(day);
    setSelectedTimeSlot(null);
    setShowCalendar(false);
  };

  const getDaysInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = startOfMonth(date).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const isSlotDisabled = (slotStart: string) => {
    if (!selectedDate) return true;
    const now = new Date();
    const isDateToday = isSameDay(selectedDate, now);
    const slotDateTime = new Date(selectedDate);
    const [hour] = slotStart.split(":");
    slotDateTime.setHours(parseInt(hour, 10), 0, 0, 0);
    const isPast = isDateToday && slotDateTime < now;
    const isBooked = bookedSlots.has(slotStart);
    return isPast || isBooked;
  };

  return {
    activeTab,
    setActiveTab,
    activeSubTab,
    setActiveSubTab,
    offices,
    loading,
    selectedOffice,
    selectedRoom,
    rooms,
    loadingRooms,
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
    handleOfficeClick,
    handleRoomClick,
    handleBookRoom,
    closeOfficeModal,
    closeRoomModal,
    selectCalendarDate,
    getDaysInMonth,
    getFirstDayOfMonth,
    isSlotDisabled,
  };
}

export type UseMeetingRoomsMobilePageResult = ReturnType<typeof useMeetingRoomsMobilePage>;
