"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { listLoadError } from "@/lib/request-list-loading";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGuestDemoStore } from "@/stores/useGuestDemoStore";
import { useToast } from "@/hooks/use-toast";
import { MEETING_ROOM_TIME_SLOTS } from "@/lib/meeting-room-time-slots";
import {
  bookingHourStart,
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
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [loadedAvailabilityKey, setLoadedAvailabilityKey] = useState<string | null>(null);
  const availabilityKey = selectedDate && selectedRoom ? `${selectedRoom.id}:${formatDateForAvailability(selectedDate)}` : null;
  const bookingLock = useRef(false);
  const retryAvailability = () => setAvailabilityAttempt((attempt) => attempt + 1);

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
        const activeRooms = (response.data || []).filter((room) => room.isActive && room.room_type !== "cabinet");
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
    let cancelled = false;
    setAvailabilityError(null);
    setLoadedAvailabilityKey(null);
    setBookedSlots(new Set());
    if (!selectedDate || !selectedRoom) {
      setLoadingAvailability(false);
      return;
    }
    if (isGuest) {
      setLoadedAvailabilityKey(availabilityKey);
      setLoadingAvailability(false);
      return;
    }
    const dateString = formatDateForAvailability(selectedDate);
    setLoadingAvailability(true);
    getRoomDailyAvailability(selectedRoom.id, dateString, 60)
      .then((response) => {
        if (cancelled) return;
        setBookedSlots(parseBookedHourSlots(dateString, response.data.bookings, response.data.slots));
        setLoadedAvailabilityKey(availabilityKey);
      })
      .catch((failure: unknown) => {
        if (!cancelled) setAvailabilityError(listLoadError(failure));
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => { cancelled = true; };
  }, [selectedDate, selectedRoom, isGuest, availabilityAttempt, availabilityKey]);

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
    if (bookingLock.current || !selectedRoom || !selectedDate || !selectedTimeSlot) return;

    const timeSlot = MEETING_ROOM_TIME_SLOTS.find((slot) => slot.label === selectedTimeSlot);
    if (!timeSlot) return;

    if (isSlotDisabled(timeSlot.start)) return;

    bookingLock.current = true;
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
      bookingLock.current = false;
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
    if (!selectedDate || !selectedRoom?.isActive || loadingAvailability || availabilityError || loadedAvailabilityKey !== availabilityKey) return true;
    const start = bookingHourStart(formatDateForAvailability(selectedDate), slotStart);
    return !Number.isFinite(start) || start < Date.now() || bookedSlots.has(slotStart);
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
    availabilityError,
    retryAvailability,
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
