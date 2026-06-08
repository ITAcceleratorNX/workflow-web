"use client";

import type { ComponentPropsWithoutRef } from "react";
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DESKTOP_MANAGEMENT_ALERT_CANCEL_CLASS,
  DESKTOP_MANAGEMENT_ALERT_CONTENT_CLASS,
  DESKTOP_MANAGEMENT_ALERT_DESCRIPTION_CLASS,
  DESKTOP_MANAGEMENT_ALERT_TITLE_CLASS,
  MANAGEMENT_MODAL_DARK_CLASS,
} from "@/constants/management-modal-ui";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export function ManagementAlertDialogContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof AlertDialogContent>) {
  const isDesktop = useIsDesktop();
  return (
    <AlertDialogContent
      className={cn(
        isDesktop && DESKTOP_MANAGEMENT_ALERT_CONTENT_CLASS,
        isDesktop && MANAGEMENT_MODAL_DARK_CLASS,
        className,
      )}
      {...props}
    />
  );
}

export function ManagementAlertDialogTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof AlertDialogTitle>) {
  const isDesktop = useIsDesktop();
  return (
    <AlertDialogTitle
      className={cn(isDesktop && DESKTOP_MANAGEMENT_ALERT_TITLE_CLASS, className)}
      {...props}
    />
  );
}

export function ManagementAlertDialogDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof AlertDialogDescription>) {
  const isDesktop = useIsDesktop();
  return (
    <AlertDialogDescription
      className={cn(isDesktop && DESKTOP_MANAGEMENT_ALERT_DESCRIPTION_CLASS, className)}
      {...props}
    />
  );
}

export function ManagementAlertDialogCancel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof AlertDialogCancel>) {
  const isDesktop = useIsDesktop();
  return (
    <AlertDialogCancel
      className={cn(isDesktop && DESKTOP_MANAGEMENT_ALERT_CANCEL_CLASS, className)}
      {...props}
    />
  );
}
