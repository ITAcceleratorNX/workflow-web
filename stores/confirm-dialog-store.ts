import { create } from "zustand";

export type ConfirmRequest = {
  title: string;
  message: string;
  /** Нет — окно только сообщает: одна кнопка «OK». */
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type Pending = ConfirmRequest & { resolve: (ok: boolean) => void };

type ConfirmDialogState = {
  pending: Pending | null;
  ask: (request: ConfirmRequest) => Promise<boolean>;
  answer: (ok: boolean) => void;
};

/**
 * Одно окно подтверждения на приложение — веб-аналог Alert.alert мобильного приложения.
 * Новый вопрос закрывает предыдущий ответом «нет».
 */
export const useConfirmDialogStore = create<ConfirmDialogState>((set, get) => ({
  pending: null,
  ask: (request) =>
    new Promise<boolean>((resolve) => {
      get().pending?.resolve(false);
      set({ pending: { ...request, resolve } });
    }),
  answer: (ok) => {
    const pending = get().pending;
    set({ pending: null });
    pending?.resolve(ok);
  },
}));

/** Спросить пользователя; «Отмена», Esc и клик мимо окна — false. */
export function confirmAction(request: ConfirmRequest): Promise<boolean> {
  return useConfirmDialogStore.getState().ask(request);
}

/** Сообщить пользователю (одна кнопка). */
export function showNotice(title: string, message: string): Promise<void> {
  return confirmAction({ title, message }).then(() => undefined);
}
