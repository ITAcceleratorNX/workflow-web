"use client";

import { ToastAction } from "@/components/ui/toast";
import type { toast as showToast } from "@/hooks/use-toast";

type Toast = typeof showToast;

/** Конструктор: черновик сохранён. */
export function toastDraftSaved(toast: Toast) {
  toast({ variant: "success", title: "Черновик сохранён", duration: 3000 });
}

/** Конструктор: черновик не сохранился — причина от сервера, правки остаются в форме. */
export function toastDraftSaveFailed(toast: Toast, reason: string) {
  toast({ variant: "error", title: "Не удалось сохранить черновик", description: reason, duration: 6000 });
}

/** Конструктор: вопрос удалён сразу, «Вернуть» ставит его на место. */
export function toastQuestionDeleted(toast: Toast, undo: () => void) {
  toast({
    variant: "info",
    title: "Вопрос удалён",
    // Время, чтобы успеть вернуть, — как у уведомлений задач с действием.
    duration: 8000,
    action: (
      <ToastAction altText="Вернуть вопрос" onClick={undo}>
        Вернуть
      </ToastAction>
    ),
  });
}
