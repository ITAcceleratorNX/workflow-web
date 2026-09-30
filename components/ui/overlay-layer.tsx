"use client";

import { createContext, useContext, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";

/** Shared layers for body portals. Child dialogs advance one step above their parent. */
export const OVERLAY_LAYERS = {
  dialog: 50,
  taskPicker: 60,
  request: 110,
  popup: 120,
  management: 200,
  confirmation: 210,
} as const;

const OverlayLayerContext = createContext<number | null>(null);

export function OverlayLayerProvider({ level, children }: { level: number; children: ReactNode }) {
  return <OverlayLayerContext.Provider value={level}>{children}</OverlayLayerContext.Provider>;
}

export function useOverlayLayer(base: number = OVERLAY_LAYERS.dialog) {
  const parent = useContext(OverlayLayerContext);
  return Math.max(base, parent == null ? base : parent + 10);
}

/** React context survives portals, unlike CSS variables inherited from the modal DOM. */
export function usePopupLayerStyle(style?: CSSProperties): CSSProperties {
  const layer = useOverlayLayer(OVERLAY_LAYERS.popup);
  return { "--overlay-popup-z": layer, ...style } as CSSProperties;
}

/** Controlled dialogs often open from ordinary buttons rather than DialogTrigger. */
export function useDialogFocusReturn(returnFocusRef?: RefObject<HTMLElement | null>) {
  const opener = useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus: () => {
      const active = document.activeElement;
      opener.current = active instanceof HTMLElement && active !== document.body && active !== document.documentElement
        ? active
        : null;
    },
    onCloseAutoFocus: (event: Event) => {
      if (event.defaultPrevented) return;
      // A touch/pointer activation need not focus its button, so callers can name
      // their trigger explicitly instead of restoring focus to BODY.
      const target = returnFocusRef?.current ?? opener.current;
      if (!target?.isConnected || target === document.body || target === document.documentElement) return;
      // Radix dispatches this event before removing the child FocusScope from its
      // stack. Restore after that cleanup, when the parent trap is active again.
      event.preventDefault();
      requestAnimationFrame(() => {
        if (!target.isConnected) return;
        target.focus({ preventScroll: true });
      });
    },
  };
}
