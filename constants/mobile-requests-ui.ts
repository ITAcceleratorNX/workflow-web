import { cn } from "@/lib/utils";

/** Follow the active page theme for both CSS classes and inline backgrounds. */
export const MOBILE_REQUESTS_PAGE_BG = "hsl(var(--background))";
/** Literal class — Tailwind JIT must see the full token at build time. */
export const MOBILE_REQUESTS_PAGE_CLASS = "min-h-screen bg-background";

/** RN Select trigger on requests list — transparent + border */
export const MOBILE_REQUESTS_FILTER_TRIGGER =
  "h-12 px-4 rounded-lg border border-border bg-transparent text-foreground";

/** Desktop requests filters / modals — explicit hex (portaled Select, no theme tokens). */
export const REQUESTS_DESKTOP_SELECT_TRIGGER =
  "h-10 rounded-lg border border-[#3A3A3C] bg-[#2C2C2E] text-white shadow-none focus:ring-2 focus:ring-[#F35713]/30";

export const REQUESTS_DESKTOP_SELECT_CONTENT =
  "bg-[#2C2C2E] border border-[#3A3A3C] text-white";

export const REQUESTS_DESKTOP_SELECT_ITEM =
  "text-white focus:bg-[#3A3A3C] focus:text-white data-[highlighted]:bg-[#3A3A3C] data-[highlighted]:text-white";

export const REQUESTS_DESKTOP_OUTLINE_BTN =
  "border-[#3A3A3C] bg-transparent text-white hover:bg-white/10 hover:text-white";

export function mobileRequestsFilterTrigger(
  variant: "mobile" | "desktop",
  extraClass?: string,
) {
  if (variant === "desktop") {
    return cn(extraClass ?? "w-[140px]", REQUESTS_DESKTOP_SELECT_TRIGGER);
  }
  return cn("flex-1 min-w-0", MOBILE_REQUESTS_FILTER_TRIGGER, extraClass);
}

export function mobileRequestsFilterContent(variant: "mobile" | "desktop") {
  if (variant === "desktop") {
    return REQUESTS_DESKTOP_SELECT_CONTENT;
  }
  return "bg-popover border border-border text-popover-foreground";
}

export function mobileRequestsFilterItem(variant: "mobile" | "desktop") {
  if (variant === "desktop") {
    return REQUESTS_DESKTOP_SELECT_ITEM;
  }
  return undefined;
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
