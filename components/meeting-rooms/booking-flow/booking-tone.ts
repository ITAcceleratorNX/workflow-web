/**
 * Оформление сценария брони: `desktop` — тёмная модалка, `mobile` — полноэкранный лист
 * на оранжевом градиенте (как в мобильном приложении).
 */
export type BookingTone = "desktop" | "mobile";

export const BOOKING_TONE = {
  desktop: {
    surface: "bg-[#2C2C2E] border border-white/10",
    field: "bg-[#2C2C2E] border border-white/10 text-white placeholder:text-[#6E6E73]",
    fieldFocus: "focus-within:border-[#E85D2B]",
    fieldError: "border-[#FF6B6B]",
    muted: "text-[#8E8E93]",
    label: "text-white",
    dayIdle: "bg-[#2C2C2E] text-white",
    daySelected: "bg-[#E85D2B] text-white",
    primary: "bg-[#E85D2B] text-white hover:bg-[#D94F15] disabled:bg-[#3A3A3C] disabled:text-[#8E8E93]",
    secondary: "bg-[#2C2C2E] text-white hover:bg-[#3A3A3C]",
    chip: "border border-white/20 text-white hover:bg-white/10",
    busy: "bg-[#2C2C2E] text-white",
    progressOn: "bg-[#E85D2B]",
    progressOff: "bg-[#3A3A3C]",
    success: "text-[#4ADE80]",
    error: "text-[#FF6B6B]",
    warning: "text-[#FACC15]",
  },
  mobile: {
    surface: "bg-white/15 border border-white/25",
    field: "bg-white/15 border border-white/30 text-white placeholder:text-white/60",
    fieldFocus: "focus-within:border-white",
    fieldError: "border-[#FF8A8A]",
    muted: "text-white/75",
    label: "text-white",
    dayIdle: "bg-white/15 text-white",
    daySelected: "bg-white text-[#E85D2B]",
    primary: "bg-white text-[#E85D2B] hover:bg-white/90 disabled:bg-white/25 disabled:text-white/60",
    secondary: "bg-black/20 text-white hover:bg-black/30",
    chip: "border border-white/60 text-white hover:bg-white/10",
    busy: "bg-black/30 text-white",
    progressOn: "bg-white",
    progressOff: "bg-white/30",
    success: "text-[#86EFAC]",
    error: "text-[#FFB4B4]",
    warning: "text-[#FDE68A]",
  },
} as const;
