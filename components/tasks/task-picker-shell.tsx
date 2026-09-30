"use client";

import type { ReactNode, RefObject } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useThemeColor } from "@/hooks/use-theme-color";
import { cn } from "@/lib/utils";
import { OVERLAY_LAYERS } from "@/components/ui/overlay-layer";

import type { TaskPickerVariant } from "@/hooks/use-task-picker-theme";

export type { TaskPickerVariant };

const DESKTOP_DIALOG_CONTENT_CLASS =
  "max-h-[min(90vh,820px)] overflow-hidden flex flex-col border-[#3A3A3C] bg-[#1C1C1E] text-white sm:rounded-2xl p-0 gap-0 [&>button]:text-[#8E8E93] [&>button]:hover:text-white [&>button]:right-5 [&>button]:top-5";

type TaskPickerShellProps = {
  open: boolean;
  onClose: () => void;
  variant?: TaskPickerVariant;
  /** Dialog title — only shown in dialog variant when provided */
  title?: string;
  maxWidthClass?: string;
  layer?: number;
  returnFocusRef?: RefObject<HTMLElement | null>;
  maxHeightClass?: string;
  /** Extra classes on the bottom sheet panel (mobile). */
  sheetPanelClassName?: string;
  children: ReactNode;
};

export function TaskPickerShell({
  open,
  onClose,
  variant = "sheet",
  title,
  maxWidthClass = "max-w-lg",
  layer = OVERLAY_LAYERS.taskPicker,
  returnFocusRef,
  maxHeightClass = "max-h-[90vh]",
  sheetPanelClassName,
  children,
}: TaskPickerShellProps) {
  const cardBackground = useThemeColor("cardBackground");
  const primary = useThemeColor("primary");
  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent layer={layer} returnFocusRef={returnFocusRef} aria-describedby={undefined} className={cn(DESKTOP_DIALOG_CONTENT_CLASS, maxWidthClass)}>
          {title ? (
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#3A3A3C] shrink-0 text-left space-y-0">
              <DialogTitle className="text-lg font-bold text-white">{title}</DialogTitle>
            </DialogHeader>
          ) : <DialogTitle className="sr-only">Выбор параметров</DialogTitle>}
          <div className="flex flex-col min-h-0 flex-1 overflow-hidden">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        layer={layer}
        returnFocusRef={returnFocusRef}
        showCloseButton={false}
        overlayClassName="bg-black/45"
        aria-describedby={undefined}
        className={cn(
          "inset-x-0 bottom-0 top-auto left-0 flex w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-t-2xl border-0 border-t border-border p-0 shadow-2xl sm:rounded-b-none !animate-none",
          maxHeightClass,
          sheetPanelClassName,
        )}
        style={{ backgroundColor: cardBackground, transform: "none" }}
      >
        <DialogTitle className="sr-only">{title ?? "Выбор параметров"}</DialogTitle>
        <div className="flex shrink-0 justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
