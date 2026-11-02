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

/** Опрос опубликован: клиенты его видят, push ушёл. */
export function toastSurveyPublished(toast: Toast) {
  toast({ variant: "success", title: "Опрос опубликован", duration: 3000 });
}

/** Опрос не опубликован — причина от сервера; черновик остаётся черновиком. */
export function toastPublishFailed(toast: Toast, reason: string) {
  toast({ variant: "error", title: "Не удалось опубликовать опрос", description: reason, duration: 6000 });
}

/** Опрос завершён: ответы больше не принимаются. */
export function toastSurveyClosed(toast: Toast) {
  toast({ variant: "success", title: "Опрос завершён", duration: 3000 });
}

/** Опрос не завершён — причина от сервера. */
export function toastCloseFailed(toast: Toast, reason: string) {
  toast({ variant: "error", title: "Не удалось завершить опрос", description: reason, duration: 6000 });
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
