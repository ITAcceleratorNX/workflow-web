"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MeetingRoomsErrorState,
  MeetingRoomsLoadingState,
} from "@/components/meeting-rooms/meeting-rooms-async-state";
import {
  getBookingStatusText,
  MY_BOOKINGS_FILTERS,
} from "@/components/meeting-rooms/meeting-rooms-constants";
import { getRoleLabel } from "@/constants/roles";
import { useOfficeBookings } from "@/hooks/use-office-bookings";
import { getOffices, type MeetingRoomBooking, type MyBookingsStatusFilter, type Office } from "@/lib/api";
import { formatDateOnly, formatTimeOnly } from "@/lib/dateTimeUtils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

const ALL_OFFICES = "all";

const EMPTY_MESSAGES: Record<MyBookingsStatusFilter, string> = {
  active: "Нет активных бронирований",
  completed: "Нет завершённых бронирований",
  cancelled: "Нет отменённых бронирований",
};

function bookingOffice(booking: MeetingRoomBooking) {
  return booking.office || booking.meetingRoom?.office || booking.meeting_room?.office;
}

/**
 * Бронирования переговорных для персонала, включая созданные Клиентами.
 * Администратор видит все офисы (с фильтром по офису), Офис-менеджер — только свой офис:
 * область видимости задаёт бэкенд по роли.
 */
export function OfficeBookings() {
  const role = useAuthStore((s) => s.user?.role ?? s.role);
  const ownOfficeName = useAuthStore((s) => s.user?.office?.name);
  const isOfficeManager = role === "department-head";

  const [status, setStatus] = useState<MyBookingsStatusFilter>("active");
  const [officeId, setOfficeId] = useState<number | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const { list, total, hasMore, loading, loadingMore, error, loadMore, refresh } =
    useOfficeBookings(status, isOfficeManager ? null : officeId);

  useEffect(() => {
    if (isOfficeManager) return;
    let cancelled = false;
    getOffices()
      .then((res) => {
        if (!cancelled) setOffices(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error("Ошибка при загрузке офисов:", err));
    return () => {
      cancelled = true;
    };
  }, [isOfficeManager]);

  return (
    <div className="space-y-4 rounded-xl bg-[#1A1A1A] border border-[#3A3A3C] p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-white/80">
          {isOfficeManager
            ? `Все бронирования вашего офиса${ownOfficeName ? ` «${ownOfficeName}»` : ""}, включая брони клиентов`
            : "Бронирования всех офисов, включая брони клиентов"}
        </p>
        {!isOfficeManager && (
          <Select
            value={officeId ? String(officeId) : ALL_OFFICES}
            onValueChange={(value) => setOfficeId(value === ALL_OFFICES ? null : Number(value))}
          >
            <SelectTrigger
              aria-label="Офис"
              className="w-full md:w-64 bg-[#2C2C2E] border-white/10 text-white"
            >
              <SelectValue placeholder="Все офисы" />
            </SelectTrigger>
            <SelectContent className="bg-[#2C2C2E] border-white/10 text-white">
              <SelectItem value={ALL_OFFICES}>Все офисы</SelectItem>
              {offices.map((office) => (
                <SelectItem key={office.id} value={String(office.id)}>
                  {office.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex rounded-lg overflow-hidden bg-black/20">
        {MY_BOOKINGS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={cn(
              "relative flex-1 py-2.5 text-center text-sm font-medium transition-colors",
              status === f.value ? "bg-white/20 text-white" : "text-white/70 hover:text-white/90",
            )}
          >
            {f.label}
            {status === f.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E85D2B]" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <MeetingRoomsLoadingState message="Загрузка бронирований..." isDark className="py-12" />
      ) : error ? (
        <MeetingRoomsErrorState
          error="Не удалось загрузить бронирования"
          onRetry={() => void refresh()}
          className="py-12"
        />
      ) : list.length === 0 ? (
        <p className="text-center py-8 text-sm text-white/70">{EMPTY_MESSAGES[status]}</p>
      ) : (
        <>
          <p className="text-xs text-white/50">Всего: {total}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((booking) => {
              const roomName =
                booking.meetingRoom?.name ||
                booking.meeting_room?.name ||
                `Комната #${booking.meeting_room_id}`;
              const office = bookingOffice(booking);
              const booker = booking.client;
              return (
                <div
                  key={booking.id}
                  className="rounded-xl p-4 bg-white/[0.08] border border-white/15"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-white line-clamp-2">{roomName}</h3>
                    <span className="shrink-0 rounded-lg border border-white/30 bg-white/10 px-2 py-1 text-xs text-white/90">
                      {getBookingStatusText(booking.status)}
                    </span>
                  </div>
                  <p className="text-sm text-white/80">
                    {formatDateOnly(booking.start_time)} • {formatTimeOnly(booking.start_time)}–
                    {formatTimeOnly(booking.end_time)}
                  </p>
                  {office && (
                    <p className="text-sm text-white/70 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#E85D2B]" />
                      {office.name}
                    </p>
                  )}
                  {booker && (
                    <div className="mt-3 border-t border-white/10 pt-3 space-y-1">
                      <p className="text-sm text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 shrink-0 text-white/60" />
                        <span className="truncate">{booker.full_name || `Пользователь #${booker.id}`}</span>
                        {booker.role && (
                          <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] text-white/70">
                            {getRoleLabel(booker.role)}
                          </span>
                        )}
                      </p>
                      {booker.phone && (
                        <p className="text-sm text-white/70 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-white/60" />
                          <a href={`tel:${booker.phone.replace(/\s/g, "")}`} className="hover:text-white">
                            {booker.phone}
                          </a>
                        </p>
                      )}
                      {booking.company_name && (
                        <p className="text-sm text-white/70 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 shrink-0 text-white/60" />
                          <span className="truncate">{booking.company_name}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && list.length > 0 && hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="border-white/30 text-white bg-transparent hover:bg-white/10"
          >
            {loadingMore ? "Загрузка..." : "Загрузить ещё"}
          </Button>
        </div>
      )}
    </div>
  );
}
