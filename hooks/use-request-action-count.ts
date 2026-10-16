"use client";

import { useEffect } from "react";
import {
  hasRequestActionCount,
  REQUEST_ACTION_COUNT_POLL_MS,
  REQUEST_ACTION_COUNT_REFRESH_EVENT,
} from "@/lib/request-action-count";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRequestActionCountStore } from "@/stores/request-action-count-store";

/**
 * Число для бейджа «Заявки». Перечитывается при входе и перезагрузке, после
 * действий с заявками в этой вкладке, при возврате во вкладку и раз в
 * REQUEST_ACTION_COUNT_POLL_MS — заявки двигают и другие участники.
 */
export function useRequestActionCount(): number {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const isGuest = useAuthStore((s) => s.isGuest);
  const enabled = Boolean(token) && !isGuest && hasRequestActionCount(role);
  const count = useRequestActionCountStore((s) => s.count);
  const ownerToken = useRequestActionCountStore((s) => s.ownerToken);

  useEffect(() => {
    if (!enabled || !token) {
      useRequestActionCountStore.getState().reset();
      return;
    }
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void useRequestActionCountStore.getState().refresh(token);
      }
    };
    refresh();
    const timer = window.setInterval(refresh, REQUEST_ACTION_COUNT_POLL_MS);
    window.addEventListener(REQUEST_ACTION_COUNT_REFRESH_EVENT, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(REQUEST_ACTION_COUNT_REFRESH_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [enabled, token, role]);

  return enabled && ownerToken === token ? count : 0;
}
