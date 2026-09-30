"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { OVERLAY_LAYERS, OverlayLayerProvider, useDialogFocusReturn, useOverlayLayer } from "@/components/ui/overlay-layer";

interface RequestModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  layer?: number;
  /** Full viewport container; accepts alignment, padding and backdrop classes. */
  overlayClassName?: string;
  usePortal?: boolean;
  closeOnOverlayClick?: boolean;
  contentProps?: Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "children">;
}

/** Keeps existing request cards while providing focus containment, Escape and focus return. */
export function RequestModalShell({
  isOpen,
  onClose,
  children,
  title = "Заявка",
  description,
  layer = OVERLAY_LAYERS.request,
  overlayClassName,
  usePortal = true,
  closeOnOverlayClick = true,
  contentProps,
}: RequestModalShellProps) {
  const resolvedLayer = useOverlayLayer(layer);
  const focusReturn = useDialogFocusReturn();
  const { className, style, onOpenAutoFocus, onCloseAutoFocus, onClick, ...restContentProps } = contentProps ?? {};
  const overlayStyle = { "--overlay-dialog-z": resolvedLayer } as CSSProperties;
  const contentStyle = { ...overlayStyle, ...style };

  // Portal attaches Presence refs to each direct child, so never pass a Fragment here.
  const content = [
      <DialogPrimitive.Overlay key="overlay" className="fixed inset-0 z-[var(--overlay-dialog-z)]" style={overlayStyle} />,
      <DialogPrimitive.Content
        key="content"
        {...restContentProps}
        {...(!description ? { "aria-describedby": restContentProps["aria-describedby"] } : {})}
        className={cn(
          "fixed inset-0 z-[var(--overlay-dialog-z)] flex items-center justify-center overflow-y-auto p-4 bg-black/50 backdrop-blur-sm outline-none",
          overlayClassName,
          className,
        )}
        style={contentStyle}
        onOpenAutoFocus={(event) => {
          focusReturn.onOpenAutoFocus();
          onOpenAutoFocus?.(event);
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          focusReturn.onCloseAutoFocus(event);
        }}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && closeOnOverlayClick && event.target === event.currentTarget) onClose();
        }}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        {description ? <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description> : null}
        {children}
      </DialogPrimitive.Content>,
  ];

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <OverlayLayerProvider level={resolvedLayer}>
        {usePortal ? <DialogPrimitive.Portal>{content}</DialogPrimitive.Portal> : content}
      </OverlayLayerProvider>
    </DialogPrimitive.Root>
  );
}
