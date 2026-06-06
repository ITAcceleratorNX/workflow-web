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

/** Отступ снизу под floating BottomNav + safe area (workflow-mobile BOTTOM_NAV_ROW_HEIGHT). */
export const MOBILE_BOTTOM_NAV_PADDING =
  "calc(80px + env(safe-area-inset-bottom, 0px))";

/** Подписи вкладок — workflow-mobile/components/bottom-nav.tsx */
export const MOBILE_BOTTOM_NAV_LABELS = {
  home: "Главная",
  booking: "Бронь",
  requests: "Заявки",
  help: "Сообщение",
  profile: "Профиль",
} as const;

export type MobileBottomNavTabKey = keyof typeof MOBILE_BOTTOM_NAV_LABELS;
