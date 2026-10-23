"use client";

import { WifiOff } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import type { toast as showToast } from "@/hooks/use-toast";

type Toast = typeof showToast;

/** Figma «Тост · успешн»: a short confirmation with a close button. */
export function toastTaskCompleted(toast: Toast) {
  toast({ variant: "success", title: "Задача выполнена", duration: 3000 });
}

/**
 * Figma «Ошибка удаления»: the task stays where it was; a lost connection says so and offers
 * «Повторить», any other failure shows the server's reason.
 */
export function toastTaskDeleteFailed(toast: Toast, failure: { error: string; network: boolean }, retry: () => void) {
  toast({
    variant: "error",
    title: "Не удалось удалить задачу",
    description: failure.network ? "Нет соединения с интернетом. Задача осталась на месте." : failure.error,
    icon: failure.network ? <WifiOff /> : undefined,
    duration: 8000,
    action: (
      <ToastAction tone="product" altText="Повторить удаление задачи" onClick={retry}>
        Повторить
      </ToastAction>
    ),
  });
}

/** Any other failed change of a task, with the server's reason. */
export function toastTaskError(toast: Toast, title: string, description: string) {
  toast({ variant: "error", title, description, duration: 5000 });
}
