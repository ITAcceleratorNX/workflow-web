"use client";

import type { ReactNode, RefObject } from "react";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SheetAction = { label: string; onClick: () => void; disabled?: boolean };

/** Radix links a DialogDescription itself; without one it asks for an explicit undefined. */
function withoutDescription(description: unknown) {
  return description ? {} : { "aria-describedby": undefined };
}

type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Text action in the header, e.g. «Готово». */
  action?: SheetAction;
  /** Visually hidden description for assistive technology. */
  description?: string;
  children: ReactNode;
  layer?: number;
  returnFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * Phone sheet from the bottom of the screen (Figma «Шторка»): a grabber, the title with an
 * optional text action, then the content. Esc, a tap outside and the back gesture close it.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  action,
  description,
  children,
  layer,
  returnFocusRef,
  className,
}: BottomSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        layer={layer}
        returnFocusRef={returnFocusRef}
        showCloseButton={false}
        overlayClassName="bg-black/60"
        {...withoutDescription(description)}
        className={cn(
          "inset-x-0 bottom-0 left-0 top-auto flex max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-4 rounded-b-none rounded-t-[26px] border-0 bg-ui-surface px-5 pb-[max(30px,env(safe-area-inset-bottom))] pt-2.5 text-ui-fg shadow-2xl sm:rounded-b-none",
          "data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
          className,
        )}
      >
        <div aria-hidden className="mx-auto h-[5px] w-9 shrink-0 rounded-full bg-ui-fg/30" />
        <div className="flex shrink-0 items-center justify-between gap-3">
          <DialogTitle className="text-xl font-bold leading-6 tracking-normal text-ui-fg">{title}</DialogTitle>
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className="-mr-2 min-h-11 rounded-lg px-2 text-base font-semibold text-ui-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70 disabled:opacity-40"
            >
              {action.label}
            </button>
          ) : null}
        </div>
        {description ? <DialogDescription className="sr-only">{description}</DialogDescription> : null}
        <div className="-mx-5 min-h-0 flex-1 overflow-y-auto px-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

type ModalWindowProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Tailwind max-width class of the window. */
  widthClass?: string;
  layer?: number;
  returnFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  /** Focus target on open; the first focusable element by default. */
  onOpenAutoFocus?: (event: Event) => void;
};

/** Desktop window of the product UI (Figma «Окно»): title with a close button, content, footer. */
export function ModalWindow({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  widthClass = "max-w-[440px]",
  layer,
  returnFocusRef,
  className,
  onOpenAutoFocus,
}: ModalWindowProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        layer={layer}
        returnFocusRef={returnFocusRef}
        showCloseButton={false}
        overlayClassName="bg-black/60"
        onOpenAutoFocus={onOpenAutoFocus}
        {...withoutDescription(description)}
        className={cn(
          "max-h-[min(90vh,860px)] gap-[18px] overflow-y-auto rounded-[22px] border border-ui-fg/10 bg-ui-surface px-7 py-6 text-ui-fg shadow-2xl sm:rounded-[22px]",
          widthClass,
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <DialogTitle className="min-w-0 flex-1 text-[22px] font-bold leading-[26px] tracking-normal text-ui-fg">
            {title}
          </DialogTitle>
          <DialogClose
            className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-ui-fg/[0.08] text-ui-fg transition-colors hover:bg-ui-fg/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
            aria-label="Закрыть"
          >
            <X className="size-[18px]" aria-hidden />
          </DialogClose>
        </div>
        {description ? (
          <DialogDescription className="whitespace-pre-line text-[15px] leading-[18px] text-ui-fg/70">
            {description}
          </DialogDescription>
        ) : null}
        {children}
        {footer ? <div className="flex flex-wrap items-center justify-end gap-3">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
