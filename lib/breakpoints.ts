/** Единый breakpoint web ↔ mobile (совпадает с Tailwind `md` и workflow-mobile layout). */
export const DESKTOP_MIN_PX = 768;

/** Media query: desktop layout (sidebar, desktop frames). */
export const DESKTOP_MEDIA_QUERY = `(min-width: ${DESKTOP_MIN_PX}px)` as const;

/** Media query: mobile layout (< DESKTOP_MIN_PX). */
export const MOBILE_MEDIA_QUERY = `(max-width: ${DESKTOP_MIN_PX - 1}px)` as const;
