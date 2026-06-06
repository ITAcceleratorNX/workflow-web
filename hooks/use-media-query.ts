import { useState, useEffect } from "react";

import { DESKTOP_MEDIA_QUERY, MOBILE_MEDIA_QUERY } from "@/lib/breakpoints";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const updateMatches = () => setMatches(media.matches);

    updateMatches();
    media.addEventListener("change", updateMatches);

    return () => media.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
}

/** Возвращает { matches, resolved }. resolved=true только после первой проверки на клиенте. */
export function useMediaQueryResolved(
  query: string
): { matches: boolean; resolved: boolean } {
  const [state, setState] = useState({ matches: false, resolved: false });

  useEffect(() => {
    const media = window.matchMedia(query);
    const updateMatches = () => setState({ matches: media.matches, resolved: true });

    updateMatches();
    media.addEventListener("change", updateMatches);

    return () => media.removeEventListener("change", updateMatches);
  }, [query]);

  return state;
}

/** Desktop layout (≥ DESKTOP_MIN_PX). Предпочтительный способ вместо inline media query. */
export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_MEDIA_QUERY);
}

/** Mobile layout (< DESKTOP_MIN_PX). */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY);
}

/** Как useIsDesktop, но с флагом resolved — для redirect до определения viewport. */
export function useIsDesktopResolved(): { matches: boolean; resolved: boolean } {
  return useMediaQueryResolved(DESKTOP_MEDIA_QUERY);
}
