"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ModalWindow } from "@/components/ui/bottom-sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import { OVERLAY_LAYERS } from "@/components/ui/overlay-layer";
import { cn } from "@/lib/utils";

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
  /**
   * A tile above the title (Figma «Опубликовать опрос?»): the question stands in the middle of the
   * window and «Отмена» is outlined.
   */
  icon?: ReactNode;
  /** Short facts about what the action concerns, in a row under the description: «5 вопросов», «~2 минуты». */
  facts?: readonly string[];
};

const SHEET =
  "inset-x-0 bottom-0 left-0 top-auto flex w-full max-w-none translate-x-0 translate-y-0 flex-col gap-4 rounded-b-none rounded-t-[26px] border-0 bg-ui-surface px-5 pb-[max(30px,env(safe-area-inset-bottom))] pt-2.5 text-ui-fg data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out sm:rounded-b-none";

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
  icon,
  facts,
}: ConfirmDialogProps) {
  const isDesktop = useIsDesktop();
  const centered = icon != null;
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
    <Button variant={centered ? "neutral-outline" : "raised"} size={size} onClick={() => close(false)} disabled={busy}>
      {cancelLabel}
    </Button>
  );
  const tile = centered ? (
    <div
      aria-hidden
      className={cn(
        "mx-auto flex shrink-0 items-center justify-center rounded-[14px] bg-ui-accent-soft text-ui-accent",
        isDesktop ? "size-[52px] [&_svg]:size-6" : "size-14 [&_svg]:size-[26px]",
      )}
    >
      {icon}
    </div>
  ) : null;
  // The row stands out from the window: darker in the raised window, lighter in the sheet.
  const factsRow = facts?.length ? (
    <p className={cn("flex flex-wrap gap-x-4 gap-y-1 rounded-[10px] px-3.5 py-2.5 text-left text-sm text-ui-fg/70", isDesktop ? "bg-ui-surface" : "bg-ui-raised")}>
      {facts.map((fact) => (
        <span key={fact}>{fact}</span>
      ))}
    </p>
  ) : null;

  if (isDesktop && !centered) {
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
      >
        {factsRow}
      </ModalWindow>
    );
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={close}>
        <DialogContent
          layer={OVERLAY_LAYERS.confirmation}
          showCloseButton={false}
          overlayClassName="bg-black/60"
          className="flex max-w-[536px] flex-col gap-[18px] rounded-[22px] border border-ui-fg/10 bg-ui-raised p-7 text-center text-ui-fg shadow-2xl sm:rounded-[22px]"
        >
          {tile}
          <DialogTitle className="text-[22px] font-bold leading-[26px] tracking-normal text-ui-fg">{title}</DialogTitle>
          <DialogDescription className="whitespace-pre-line text-[15px] leading-[22px] text-ui-fg/70">{description}</DialogDescription>
          {factsRow}
          <div className="flex justify-end gap-2.5 pt-1">
            {cancelButton("md")}
            {confirmButton("md")}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        layer={OVERLAY_LAYERS.confirmation}
        showCloseButton={false}
        overlayClassName="bg-black/60"
        className={cn(SHEET, centered && "text-center")}
      >
        <div aria-hidden className="mx-auto h-[5px] w-9 rounded-full bg-ui-fg/30" />
        {tile}
        <DialogTitle className="text-[22px] font-bold leading-[26px] tracking-normal text-ui-fg">{title}</DialogTitle>
        <DialogDescription
          className={cn("whitespace-pre-line text-[15px] text-ui-fg/70", centered ? "leading-[22px]" : "leading-[18px]")}
        >
          {description}
        </DialogDescription>
        {factsRow}
        {confirmButton("block")}
        {cancelButton("block")}
      </DialogContent>
    </Dialog>
  );
}
