"use client";

import type { ReactNode } from "react";
import { TaskPickerShell } from "@/components/tasks/task-picker-shell";
import {
  MANAGEMENT_MODAL_DARK_CLASS,
  managementModalVariant,
} from "@/constants/management-modal-ui";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { TaskPickerVariant } from "@/hooks/use-task-picker-theme";

type ManagementModalShellProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidthClass?: string;
  variant?: TaskPickerVariant;
  children: ReactNode;
  bodyClassName?: string;
  /** Max height of the bottom sheet panel on mobile. */
  sheetMaxHeightClass?: string;
};

/** Bottom sheet on mobile, centered dark dialog on desktop — admin/manager CRUD modals. */
export function ManagementModalShell({
  open,
  onClose,
  title,
  maxWidthClass = "max-w-lg",
  variant,
  children,
  bodyClassName,
  sheetMaxHeightClass = "max-h-[90vh]",
}: ManagementModalShellProps) {
  const isDesktop = useIsDesktop();
  const resolvedVariant = variant ?? managementModalVariant(isDesktop);

  return (
    <TaskPickerShell
      open={open}
      onClose={onClose}
      variant={resolvedVariant}
      title={resolvedVariant === "dialog" ? title : undefined}
      maxWidthClass={maxWidthClass}
      maxHeightClass={sheetMaxHeightClass}
      zIndexClass="z-[200]"
    >
      <div
        className={cn(
          "overflow-y-auto",
          resolvedVariant === "dialog"
            ? cn("px-6 pb-6 pt-2", MANAGEMENT_MODAL_DARK_CLASS)
            : cn(
                "px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-4",
                MANAGEMENT_MODAL_DARK_CLASS,
              ),
          bodyClassName,
        )}
      >
        {children}
      </div>
    </TaskPickerShell>
  );
}
