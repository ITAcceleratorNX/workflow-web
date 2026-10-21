"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createMeetingRoomBooking,
  getRoomDailyAvailability,
  type MeetingRoomBooking,
} from "@/lib/api";
import {
  almatyDay,
  almatyMinutes,
  bookingWeek,
  busyIntervals,
  checkBookingTime,
  firstBookableDay,
  officeHours,
  parseTime,
  suggestFreeSlots,
  toIso,
  type Interval,
} from "@/lib/booking-flow";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGuestDemoStore } from "@/stores/useGuestDemoStore";

export type BookingStep = "time" | "details";

export interface BookingRoomInfo {
  id: number;
  name: string;
  floor?: number;
  photos?: string[];
  office?: { id?: number; name?: string; working_hours_start?: string | null; working_hours_end?: string | null } | null;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

/**
 * Состояние двухшагового сценария брони: дата и время (шаг 1), компания и пожелания (шаг 2).
 * Занятость и часы офиса берутся из /rooms/:id/availability выбранного дня.
 */
export function useRoomBooking(room: BookingRoomInfo, { onBooked }: { onBooked: (booking: MeetingRoomBooking) => void }) {
  const profileCompany = useAuthStore((s) => s.user?.company?.name?.trim() || null);
  // Демо-режим гостя: брони живут локально, без сервера.
  const isGuest = useAuthStore((s) => s.isGuest);
  const guestBookings = useGuestDemoStore((s) => s.guestBookings);
  const addGuestBooking = useGuestDemoStore((s) => s.addGuestBooking);

  // «Сейчас» — состояние, обновляемое раз в минуту: сегодня нельзя начать раньше текущего времени.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const [step, setStep] = useState<BookingStep>("time");
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useMemo(() => bookingWeek(now, weekOffset), [now, weekOffset]);
  const [day, setDay] = useState<string | null>(() => {
    const start = Date.now();
    return firstBookableDay(bookingWeek(start)) ?? firstBookableDay(bookingWeek(start, 1));
  });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [busy, setBusy] = useState<Interval[]>([]);
  const [hours, setHours] = useState<Interval>(() => officeHours(room.office));
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Компания: по умолчанию из профиля; своя — только для этой брони.
  const [companyOverride, setCompanyOverride] = useState<string | null>(profileCompany ? null : "");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!day) return;
    if (isGuest) {
      const own = guestBookings.filter((b) => b.meeting_room_id === room.id && b.status !== "cancelled");
      // Старые гостевые брони сохранены без часового пояса — это время Алматы.
      const zoned = (value: string) => (/(Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}+05:00`);
      setBusy(busyIntervals(day, own.map((b) => ({ start_time: zoned(b.start_time), end_time: zoned(b.end_time) }))));
      return;
    }
    let cancelled = false;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    getRoomDailyAvailability(room.id, day)
      .then((res) => {
        if (cancelled) return;
        setBusy(busyIntervals(day, res.data.bookings ?? []));
        if (res.data.room?.office) setHours(officeHours(res.data.room.office));
      })
      .catch((error) => {
        if (cancelled) return;
        setBusy([]);
        setAvailabilityError(apiErrorMessage(error, "Не удалось загрузить занятость"));
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [room.id, day, reloadKey, isGuest, guestBookings]);

  const nowMinutes = day && day === almatyDay(now) ? almatyMinutes(now) : null;
  const check = useMemo(() => checkBookingTime({ from, to, hours, busy, nowMinutes }), [from, to, hours, busy, nowMinutes]);
  const suggestions = useMemo(() => {
    if (check.ok || check.reason !== "busy") return [];
    const start = parseTime(from);
    const end = parseTime(to);
    if (start === null || end === null) return [];
    return suggestFreeSlots({ start, end, hours, busy, nowMinutes });
  }, [check, from, to, hours, busy, nowMinutes]);

  const companyName = companyOverride === null ? profileCompany : companyOverride.trim();
  const companyMissing = !companyName;
  const canContinue = !!day && check.ok && !availabilityLoading && !availabilityError;
  const canSubmit = canContinue && !companyMissing && !submitting;

  const changeWeek = useCallback(
    (delta: number) => {
      const next = Math.max(0, weekOffset + delta);
      setWeekOffset(next);
      setDay(firstBookableDay(bookingWeek(now, next)));
    },
    [now, weekOffset],
  );

  const pickSlot = useCallback((slot: Interval) => {
    const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    setFrom(fmt(slot.start));
    setTo(fmt(slot.end));
  }, []);

  const submit = useCallback(async () => {
    if (!canSubmit || !day || !check.ok) return;
    const start = parseTime(from)!;
    const end = parseTime(to)!;
    setSubmitting(true);
    setSubmitError(null);
    if (isGuest) {
      const id = addGuestBooking({
        meeting_room_id: room.id,
        start_time: toIso(day, start),
        end_time: toIso(day, end),
        status: "scheduled",
        company_name: companyName,
        meeting_room: { id: room.id, name: room.name },
      });
      setSubmitting(false);
      onBooked({ id, meeting_room_id: room.id, start_time: toIso(day, start), end_time: toIso(day, end), status: "scheduled" });
      return;
    }
    try {
      const res = await createMeetingRoomBooking({
        meeting_room_id: room.id,
        start_time: toIso(day, start),
        end_time: toIso(day, end),
        // Своя компания — только для этой брони; иначе бэкенд подставит компанию из профиля.
        company_name: companyOverride !== null && companyName !== profileCompany ? companyName : null,
        comment: comment.trim() || null,
      });
      onBooked(res.data);
    } catch (error) {
      setSubmitError(apiErrorMessage(error, "Не удалось создать бронь"));
      // Время могли занять, пока Клиент заполнял детали.
      setReloadKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, day, check, from, to, room.id, room.name, isGuest, addGuestBooking, companyOverride, companyName, profileCompany, comment, onBooked]);

  return {
    step,
    setStep,
    week,
    weekOffset,
    changeWeek,
    day,
    setDay,
    from,
    setFrom,
    to,
    setTo,
    busy,
    hours,
    availabilityLoading,
    availabilityError,
    retryAvailability: () => setReloadKey((k) => k + 1),
    check,
    suggestions,
    pickSlot,
    canContinue,
    profileCompany,
    companyOverride,
    setCompanyOverride,
    companyName,
    companyMissing,
    comment,
    setComment,
    submit,
    submitting,
    submitError,
    canSubmit,
  };
}

export type RoomBookingState = ReturnType<typeof useRoomBooking>;
