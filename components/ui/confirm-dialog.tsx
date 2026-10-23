"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ModalWindow } from "@/components/ui/bottom-sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import { OVERLAY_LAYERS } from "@/components/ui/overlay-layer";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` — an irreversible action such as deletion. */
  tone?: "danger" | "accent";
  onConfirm: () => void;
  /** The action is running: buttons are locked and the confirm button shows a spinner. */
  busy?: boolean;
};

/**
 * A question before an action (Figma «Удалить задачу?»): a sheet with full-width buttons on a
 * phone, a window with buttons on the right on a desktop. Cancel, Esc and a tap outside close it.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Отмена",
  tone = "danger",
  onConfirm,
  busy = false,
}: ConfirmDialogProps) {
  const isDesktop = useIsDesktop();
  const close = (next: boolean) => {
    if (!busy) onOpenChange(next);
  };
  const confirmButton = (size: "block" | "md") => (
    <Button variant={tone === "danger" ? "danger" : "accent"} size={size} onClick={onConfirm} disabled={busy} aria-busy={busy}>
      {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {confirmLabel}
    </Button>
  );
  const cancelButton = (size: "block" | "md") => (
    <Button variant="raised" size={size} onClick={() => close(false)} disabled={busy}>
      {cancelLabel}
    </Button>
  );

  if (isDesktop) {
    return (
      <ModalWindow
        open={open}
        onOpenChange={close}
        title={title}
        description={description}
        layer={OVERLAY_LAYERS.confirmation}
        footer={
          <>
            {cancelButton("md")}
            {confirmButton("md")}
          </>
        }
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        layer={OVERLAY_LAYERS.confirmation}
        showCloseButton={false}
        overlayClassName="bg-black/60"
        className="inset-x-0 bottom-0 left-0 top-auto flex w-full max-w-none translate-x-0 translate-y-0 flex-col gap-4 rounded-b-none rounded-t-[26px] border-0 bg-ui-surface px-5 pb-[max(30px,env(safe-area-inset-bottom))] pt-2.5 text-ui-fg data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out sm:rounded-b-none"
      >
        <div aria-hidden className="mx-auto h-[5px] w-9 rounded-full bg-ui-fg/30" />
        <DialogTitle className="text-[22px] font-bold leading-[26px] tracking-normal text-ui-fg">{title}</DialogTitle>
        <DialogDescription className="whitespace-pre-line text-[15px] leading-[18px] text-ui-fg/70">
          {description}
        </DialogDescription>
        {confirmButton("block")}
        {cancelButton("block")}
      </DialogContent>
    </Dialog>
  );
}
