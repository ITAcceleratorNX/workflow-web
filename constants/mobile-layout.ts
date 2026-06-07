/**
 * Mobile layout presets — aligned with workflow-mobile tabs & gradients.
 */

/** Градиенты full-screen mobile страниц (cabinet, executor drill-down). */
export const MOBILE_PAGE_GRADIENTS = {
  executor:
    "linear-gradient(180deg, #1C1C1E 0%, #2C2C2E 25%, #E25B21 45%, #E25B21 70%, #4A2510 90%, #1C1C1E 100%)",
  client:
    "linear-gradient(180deg, #1C1C1E 0%, #2C2C2E 25%, #E25B21 45%, #E25B21 70%, #4A2510 90%, #1C1C1E 100%)",
  plain: "linear-gradient(180deg, #1C1C1E 0%, #2C2C2E 50%, #1C1C1E 100%)",
} as const;

export type MobilePageGradient = keyof typeof MOBILE_PAGE_GRADIENTS;

/** Совпадает с последним стопом градиента на booking — закрашивает запас под absolute BottomNav. */
export const BOOKING_TAB_SCENE_UNDERLAY = "#281504";

export {
  MOBILE_BOTTOM_NAV_LABELS,
  MOBILE_BOTTOM_NAV_PADDING,
  type MobileBottomNavTabKey,
} from "@/lib/bottom-nav";
