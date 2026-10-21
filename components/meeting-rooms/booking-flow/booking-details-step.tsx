"use client";

import { AlertCircle, Building2, Plus, Undo2 } from "lucide-react";
import { BOOKING_COMMENT_MAX, COMMENT_QUICK_ADDS, appendToComment, formatBookingDay, formatDuration } from "@/lib/booking-flow";
import { cn } from "@/lib/utils";
import { BOOKING_TONE, type BookingTone } from "./booking-tone";
import type { BookingRoomInfo, RoomBookingState } from "./use-room-booking";

/** Шаг 2: сводка, компания (из профиля или своя — только для этой брони) и пожелания. */
export function BookingDetailsStep({
  state,
  room,
  tone,
}: {
  state: RoomBookingState;
  room: BookingRoomInfo;
  tone: BookingTone;
}) {
  const t = BOOKING_TONE[tone];
  const { day, from, to, check, profileCompany, companyOverride, setCompanyOverride, comment, setComment } = state;
  const photo = room.photos?.[0];
  const editingCompany = companyOverride !== null;

  return (
    <div className="space-y-6">
      <div className={cn("flex items-center gap-3 rounded-2xl p-3", t.surface)}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded-xl bg-black/20" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{room.name}</p>
          <p className={cn("text-sm", t.muted)}>
            {day ? formatBookingDay(day) : ""} · {from}–{to}
            {check.ok ? ` · ${formatDuration(check.duration)}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => state.setStep("time")}
          className={cn("shrink-0 text-sm font-semibold", tone === "mobile" ? "text-white" : "text-[#FF8A5B]")}
        >
          Изменить
        </button>
      </div>

      <section>
        <h3 className={cn("mb-2 text-base font-semibold", t.label)}>Компания</h3>
        {!editingCompany && profileCompany ? (
          <div className={cn("flex items-center gap-3 rounded-2xl px-4 py-3", t.surface)}>
            <Building2 className="h-5 w-5 shrink-0 text-white/80" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">{profileCompany}</p>
              <p className={cn("text-xs", t.muted)}>Из вашего профиля</p>
            </div>
            <button
              type="button"
              onClick={() => setCompanyOverride(profileCompany)}
              className={cn("shrink-0 text-sm font-semibold", tone === "mobile" ? "text-white" : "text-[#FF8A5B]")}
            >
              Изменить для этой брони
            </button>
          </div>
        ) : (
          <>
            <label className={cn("flex items-center gap-3 rounded-2xl px-4 py-3", t.field, t.fieldFocus, state.companyMissing && "border-[#FACC15]")}>
              <Building2 className="h-5 w-5 shrink-0 text-white/80" aria-hidden />
              <input
                value={companyOverride ?? ""}
                onChange={(event) => setCompanyOverride(event.target.value.slice(0, 255))}
                placeholder="Название компании"
                aria-label="Название компании для этой брони"
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/50"
                autoFocus={editingCompany && !!profileCompany}
              />
              {profileCompany && (
                <button
                  type="button"
                  onClick={() => setCompanyOverride(null)}
                  aria-label="Вернуть компанию из профиля"
                  className="shrink-0 text-white/70 hover:text-white"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
              )}
            </label>
            {profileCompany ? (
              <p className={cn("mt-1.5 text-xs", t.muted)}>Только для этой брони — компания в профиле не изменится.</p>
            ) : (
              <p className={cn("mt-1.5 flex items-start gap-1.5 text-xs", t.warning)}>
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                В профиле не указана компания — введите её для этой брони
              </p>
            )}
          </>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className={cn("text-base font-semibold", t.label)}>Комментарий</h3>
          <span className={cn("text-xs", t.muted)}>необязательно</span>
        </div>
        <div className={cn("rounded-2xl px-4 py-3", t.field, t.fieldFocus)}>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, BOOKING_COMMENT_MAX))}
            rows={3}
            placeholder="Пожелания к встрече, например: вода, дополнительные стулья"
            aria-label="Пожелания к брони"
            className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/50"
          />
          <p className={cn("text-right text-xs", t.muted)}>
            {comment.length} / {BOOKING_COMMENT_MAX}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMMENT_QUICK_ADDS.map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => setComment(appendToComment(comment, phrase))}
              className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm", t.chip)}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {phrase}
            </button>
          ))}
        </div>
      </section>

      {state.submitError && (
        <p className={cn("flex items-start gap-1.5 text-sm font-medium", t.error)} role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.submitError}
        </p>
      )}
    </div>
  );
}
