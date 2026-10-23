"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarCheck, CalendarX, ChevronLeft, ChevronRight, Clock, DoorOpen } from "lucide-react";
import {
  getMeetingRoomDailyCalendar,
  getMeetingRoomWeeklyCalendar,
  type DailyCalendarData,
  type WeeklyCalendarData,
} from "@/lib/api";
import { listLoadError } from "@/lib/request-list-loading";
import { cn } from "@/lib/utils";
import type { UseManagerStatisticsPageResult } from "@/hooks/use-manager-statistics-page";
import { BarRow, EmptyState, ErrorBlock, KpiCard, LoadingBlock, Panel } from "./stats-ui";

const DAY_HOURS = Array.from({ length: 10 }, (_, i) => 9 + i);

function formatDuration(minutes: number) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} ч ${m} мин`;
  return h ? `${h} ч` : `${m} мин`;
}

function RoomList({ rooms }: { rooms: { room_id: number; room_name: string; office_name: string; occupancy_percentage: number }[] }) {
  if (rooms.length === 0) {
    return <p className="py-6 text-center text-sm text-white/50">Переговорных нет</p>;
  }
  return (
    <ul className="divide-y divide-white/[0.08]">
      {rooms.slice(0, 3).map((room) => (
        <li key={room.room_id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <span className="min-w-0">
            <span className="block truncate text-sm text-white">{room.room_name}</span>
            <span className="block truncate text-[13px] text-white/50">{room.office_name}</span>
          </span>
          <span className="shrink-0 text-base font-semibold text-white tabular-nums">{room.occupancy_percentage}%</span>
        </li>
      ))}
    </ul>
  );
}

/** Ячейка загрузки: насыщенность оранжевого растёт с процентом. */
function loadCellStyle(percent: number) {
  if (percent <= 0) return undefined;
  const alpha = Math.min(0.85, 0.3 + (percent / 100) * 0.7);
  return { backgroundColor: `rgba(232, 93, 43, ${alpha})` };
}

function RoomLabel({ name, office }: { name: string; office: string }) {
  return (
    <div className="min-w-0 pr-4">
      <p className="text-sm leading-tight text-white">{name}</p>
      <p className="mt-0.5 truncate text-xs text-white/50">{office}</p>
    </div>
  );
}

function LoadCalendar({ office }: { office: string }) {
  const [mode, setMode] = useState<"day" | "week">("week");
  const [date, setDate] = useState(() => new Date());
  const [weekly, setWeekly] = useState<WeeklyCalendarData | null>(null);
  const [daily, setDaily] = useState<DailyCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const todayKey = format(new Date(), "yyyy-MM-dd");

  const load = useCallback(async () => {
    const current = ++version.current;
    setLoading(true);
    setError(null);
    try {
      if (mode === "week") {
        const start = startOfWeek(date, { weekStartsOn: 1 });
        const response = await getMeetingRoomWeeklyCalendar(format(start, "yyyy-MM-dd"), format(addDays(start, 6), "yyyy-MM-dd"), office);
        if (current === version.current) setWeekly(response.data);
      } else {
        const response = await getMeetingRoomDailyCalendar(format(date, "yyyy-MM-dd"), office);
        if (current === version.current) setDaily(response.data);
      }
    } catch (failure) {
      if (current === version.current) setError(listLoadError(failure));
    } finally {
      if (current === version.current) setLoading(false);
    }
  }, [mode, date, office]);

  useEffect(() => {
    void load();
    return () => { version.current += 1; };
  }, [load]);

  const shift = (direction: 1 | -1) =>
    setDate((d) => (mode === "week" ? (direction > 0 ? addWeeks(d, 1) : subWeeks(d, 1)) : addDays(d, direction)));

  const weekEnd = addDays(weekStart, 6);
  const title =
    mode === "week"
      ? weekStart.getMonth() === weekEnd.getMonth()
        ? `${format(weekStart, "d")}–${format(weekEnd, "d MMMM yyyy", { locale: ru })}`
        : `${format(weekStart, "d MMMM", { locale: ru })} – ${format(weekEnd, "d MMMM yyyy", { locale: ru })}`
      : (() => {
          const text = format(date, "EEEE, d MMMM", { locale: ru });
          return text[0].toUpperCase() + text.slice(1);
        })();

  const navButton = "flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/15 text-white hover:bg-white/5";
  const segment = (active: boolean) =>
    cn("h-[29px] rounded-lg px-3 text-sm font-medium", active ? "bg-[#E85D2B] text-white" : "text-white/70 hover:text-white");
  const cell = "flex h-11 items-center justify-center rounded-lg bg-white/[0.06] text-xs";

  const rooms = mode === "week" ? weekly?.rooms ?? [] : daily?.rooms ?? [];

  return (
    <section className="rounded-xl border border-[#39393c] bg-[#2a2a2c] p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Календарь загрузки</h2>
          <p className="mt-0.5 text-[13px] text-white/50">
            {mode === "week" ? "% занятого рабочего времени (8 ч в день)" : "Брони по часам"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" aria-label={mode === "week" ? "Предыдущая неделя" : "Предыдущий день"} onClick={() => shift(-1)} className={navButton}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[180px] text-center text-base font-medium text-white">{title}</span>
          <button type="button" aria-label={mode === "week" ? "Следующая неделя" : "Следующий день"} onClick={() => shift(1)} className={navButton}>
            <ChevronRight className="h-4 w-4" />
          </button>
          {mode === "day" && format(date, "yyyy-MM-dd") !== todayKey && (
            <button type="button" onClick={() => setDate(new Date())} className="text-sm font-medium text-[#E85D2B] hover:underline">
              Сегодня
            </button>
          )}
          <div className="flex h-10 items-center gap-0.5 rounded-[10px] border border-white/10 bg-[#2c2c2e] p-[5px]">
            <button type="button" className={segment(mode === "day")} onClick={() => setMode("day")}>День</button>
            <button type="button" className={segment(mode === "week")} onClick={() => setMode("week")}>Неделя</button>
          </div>
        </div>
      </div>

      {error ? (
        <ErrorBlock error={error} onRetry={load} />
      ) : loading && rooms.length === 0 ? (
        <p role="status" className="py-10 text-center text-sm text-white/60">Загрузка календаря…</p>
      ) : rooms.length === 0 ? (
        <EmptyState icon={DoorOpen} title="Переговорных нет" text="В выбранном офисе нет активных переговорных." className="py-8" />
      ) : (
        <div className={cn("overflow-x-auto", loading && "opacity-60")}>
          {mode === "week" && weekly ? (
            <div className="grid min-w-[860px] grid-cols-[220px_repeat(7,minmax(0,1fr))] gap-x-1.5 gap-y-2">
              <span />
              {Array.from({ length: 7 }, (_, i) => {
                const day = addDays(weekStart, i);
                const isToday = format(day, "yyyy-MM-dd") === todayKey;
                return (
                  <span key={i} className={cn("pb-1 text-center", isToday ? "text-[#E85D2B]" : "text-white")}>
                    <span className={cn("block text-[11px]", !isToday && "text-white/50")}>{format(day, "EEEEEE", { locale: ru })}</span>
                    <span className="block text-base font-medium">{format(day, "d")}</span>
                  </span>
                );
              })}
              {weekly.rooms.map((room) => (
                <div key={room.room_id} className="contents">
                  <RoomLabel name={room.room_name} office={room.office_name} />
                  {Array.from({ length: 7 }, (_, i) => {
                    const key = format(addDays(weekStart, i), "yyyy-MM-dd");
                    const day = room.days.find((d) => d.date.slice(0, 10) === key);
                    const percent = day?.occupancy_percentage ?? 0;
                    const bookings = day?.bookings ?? [];
                    return (
                      <span
                        key={key}
                        className={cn(cell, key === todayKey && percent === 0 && "bg-white/[0.1]", percent > 0 ? "font-semibold text-white" : "text-white/30")}
                        style={loadCellStyle(percent)}
                        title={bookings.length ? bookings.map((b) => b.user?.full_name ?? "Бронь").join("\n") : undefined}
                      >
                        {percent > 0 ? `${percent}%` : "—"}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : daily ? (
            <div className="grid min-w-[960px] grid-cols-[220px_repeat(10,minmax(0,1fr))] gap-x-1.5 gap-y-2">
              <span />
              {DAY_HOURS.map((h) => (
                <span key={h} className="pb-1 text-center text-base font-medium text-white">{h}:00</span>
              ))}
              {daily.rooms.map((room) => (
                <div key={room.room_id} className="contents">
                  <RoomLabel name={room.room_name} office={room.office_name} />
                  {DAY_HOURS.map((h) => {
                    const slot = room.slots.find((s) => s.hour === h);
                    const booked = Boolean(slot?.isBooked || slot?.is_available === false);
                    const who = [slot?.booking_user?.full_name, slot?.company_name].filter(Boolean).join(" · ");
                    return (
                      <span
                        key={h}
                        className={cn(cell, booked ? "bg-[#8a3518] font-semibold text-white" : "text-white/30")}
                        title={booked ? `${h}:00–${h + 1}:00${who ? `\n${who}` : ""}` : undefined}
                      >
                        {booked ? "Бронь" : "—"}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

export function RoomsTab(state: UseManagerStatisticsPageResult) {
  const { rooms, reloadRooms, office } = state;
  const stats = rooms.data;

  if (rooms.error && !stats) return <ErrorBlock error={rooms.error} onRetry={reloadRooms} />;
  if (!stats) return <LoadingBlock />;

  const peaks = [...stats.peakHours].sort((a, b) => b.booking_count - a.booking_count).slice(0, 4);
  const maxPeak = Math.max(...peaks.map((p) => p.booking_count), 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <KpiCard tone="orange" icon={CalendarCheck} label="Броней за период" value={stats.totalBookingsThisMonth} />
        <KpiCard tone="neutral" icon={Clock} label="Средняя длительность" value={formatDuration(stats.averageBookingDuration)} />
        <KpiCard tone="red" icon={CalendarX} label="Отмен и неявок" value={stats.cancellationsAndNoShows} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Самые загруженные" note="за период">
          <RoomList rooms={stats.mostLoadedRooms} />
        </Panel>
        <Panel title="Самые свободные" note="за период">
          <RoomList rooms={stats.mostFreeRooms} />
        </Panel>
        <Panel title="Пиковые часы" note="броней">
          {peaks.length > 0 ? (
            <div className="space-y-4">
              {peaks.map((p) => (
                <BarRow key={p.hour} label={`${p.hour}:00`} value={p.booking_count} max={maxPeak} display={p.booking_count} />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-white/50">За период броней не было</p>
          )}
        </Panel>
      </div>
      <LoadCalendar office={office} />
    </div>
  );
}
