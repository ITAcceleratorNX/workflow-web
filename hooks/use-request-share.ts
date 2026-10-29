"use client";

import { useCallback, useState } from "react";
import { createRequestShareLink } from "@/lib/api";
import { guestRequestUrl, requestShareText } from "@/lib/request-share-link";
import { useIsDesktop } from "@/hooks/use-media-query";
import { toast } from "@/hooks/use-toast";

export interface RequestShareTarget {
  requestId: number;
  url: string;
  title?: string | null;
  /** «Заявка #123: Название» — подпись к ссылке в мессенджере. */
  text: string;
}

// Ссылка заявки не меняется: запрашиваем её у backend один раз за сессию страницы.
const shareUrls = new Map<number, Promise<string>>();

function getShareUrl(requestId: number): Promise<string> {
  let url = shareUrls.get(requestId);
  if (!url) {
    url = createRequestShareLink(requestId).then(({ data }) =>
      guestRequestUrl(window.location.origin, data.token),
    );
    shareUrls.set(requestId, url);
    url.catch(() => shareUrls.delete(requestId));
  }
  return url;
}

/**
 * Заранее получить ссылку, пока открыто меню действий: системное «Поделиться» на телефоне
 * срабатывает только сразу после нажатия, а ожидание ответа сервера его отменяет.
 */
export function prefetchRequestShareLink(requestId: number): void {
  getShareUrl(requestId).catch(() => {});
}

/**
 * «Поделиться ссылкой»: на телефоне — системное меню «Поделиться», на компьютере (или если
 * браузер меню не показал) — окно с копированием и отправкой в WhatsApp / Telegram.
 */
export function useRequestShare() {
  const isDesktop = useIsDesktop();
  const [target, setTarget] = useState<RequestShareTarget | null>(null);

  const share = useCallback(
    async (requestId: number, title?: string | null) => {
      let url: string;
      try {
        url = await getShareUrl(requestId);
      } catch {
        toast({
          variant: "error",
          title: "Не удалось создать ссылку",
          description: "Проверьте соединение и попробуйте ещё раз.",
          duration: 5000,
        });
        return;
      }
      const next = { requestId, url, title, text: requestShareText(requestId, title) };

      if (!isDesktop && typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title: next.text, text: next.text, url });
          return;
        } catch (err) {
          if ((err as Error)?.name === "AbortError") return;
          // NotAllowedError и прочее — показываем окно, где «Поделиться» нажимают заново.
        }
      }
      setTarget(next);
    },
    [isDesktop],
  );

  const close = useCallback(() => setTarget(null), []);

  return { share, target, close };
}
