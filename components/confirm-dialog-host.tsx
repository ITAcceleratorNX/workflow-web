"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useConfirmDialogStore } from "@/stores/confirm-dialog-store";
import { cn } from "@/lib/utils";

/** Окно для confirmAction / showNotice; монтируется один раз в корневом layout. */
export function ConfirmDialogHost() {
  const pending = useConfirmDialogStore((s) => s.pending);
  const answer = useConfirmDialogStore((s) => s.answer);
  const isQuestion = Boolean(pending?.confirmLabel);

  return (
    <AlertDialog open={pending != null} onOpenChange={(open) => !open && answer(false)}>
      <AlertDialogContent className="max-w-sm border-[#3A3A3C] bg-[#1C1C1E] text-white sm:rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{pending?.title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line text-[#AEAEB2]">
            {pending?.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {isQuestion ? (
            <AlertDialogCancel
              className="border-[#3A3A3C] bg-[#2C2C2E] text-white hover:bg-[#3A3A3C] hover:text-white"
              onClick={() => answer(false)}
            >
              {pending?.cancelLabel ?? "Отмена"}
            </AlertDialogCancel>
          ) : null}
          <AlertDialogAction
            className={cn(
              "text-white",
              pending?.destructive ? "bg-red-600 hover:bg-red-700" : "bg-[#E25B21] hover:bg-[#c94f1c]",
            )}
            onClick={() => answer(true)}
          >
            {pending?.confirmLabel ?? "OK"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
