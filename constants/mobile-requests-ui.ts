import { MOBILE_PAGE_BACKGROUND } from "@/constants/mobile-theme";
import { cn } from "@/lib/utils";

/** RN ThemedView background — explicit hex so body.admin-management-mobile cannot override. */
export const MOBILE_REQUESTS_PAGE_BG = MOBILE_PAGE_BACKGROUND.dark;
/** Literal class — Tailwind JIT must see the full token at build time. */
export const MOBILE_REQUESTS_PAGE_CLASS = "min-h-screen bg-[#040404]";

/** RN Select trigger on requests list — transparent + border */
export const MOBILE_REQUESTS_FILTER_TRIGGER =
  "h-12 px-4 rounded-lg border border-border bg-transparent text-foreground";

export function mobileRequestsFilterTrigger(
  variant: "mobile" | "desktop",
  extraClass?: string,
) {
  if (variant === "desktop") {
    return cn(extraClass ?? "w-[140px]", "bg-desktop-card border-white/10 text-white");
  }
  return cn("flex-1 min-w-0", MOBILE_REQUESTS_FILTER_TRIGGER, extraClass);
}

export function mobileRequestsFilterContent(variant: "mobile" | "desktop") {
  if (variant === "desktop") {
    return "bg-desktop-card border-white/10";
  }
  return "z-[110] bg-[#040404] border border-border text-foreground";
}

/** RN requests tab row */
export const MOBILE_REQUESTS_TABS_ROW =
  "flex flex-wrap gap-2 mb-4 pb-3 border-b border-border";

export function mobileRequestsTabClass(active: boolean) {
  return cn(
    "min-h-11 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
    active
      ? "bg-[hsl(var(--brand-accent-soft))] text-primary"
      : "text-muted-foreground",
  );
}

export const MOBILE_REQUESTS_LOAD_MORE_BTN =
  "border-border bg-transparent text-foreground hover:bg-surface-elevated";

export const MOBILE_REQUESTS_EMPTY_TEXT = "text-muted-foreground";

/** RN RequestActionMenu bottom sheet — cardBackground (#1A1A1A dark) */
export const MOBILE_REQUESTS_ACTION_SHEET =
  "bg-card border-t border-border text-foreground";

export const MOBILE_REQUESTS_ACTION_TRIGGER =
  "h-11 w-11 rounded-full bg-white/10 hover:bg-white/[0.14] text-foreground flex items-center justify-center transition-colors";

/** RN CommentsModal sheet */
export const MOBILE_REQUESTS_COMMENTS_SHEET =
  "bg-surface border-t border-border text-foreground";
