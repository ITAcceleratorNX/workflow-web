"use client";

import { useRef } from "react";
import { Check, Copy, Send, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RequestShareTarget } from "@/hooks/use-request-share";
import { toast } from "@/hooks/use-toast";
import {
  requestShareMessage,
  telegramShareUrl,
  whatsAppShareUrl,
} from "@/lib/request-share-link";
import { cn } from "@/lib/utils";

type RequestShareDialogProps = {
  target: RequestShareTarget | null;
  onClose: () => void;
};

const OPTION_CLASS =
  "flex flex-col items-center justify-center gap-2 rounded-xl bg-[#2C2C2E] px-2 py-3 text-xs font-medium text-white transition-colors hover:bg-[#3A3A3C]";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.3-.4.7-1.2.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}

/**
 * Отправка ссылки на заявку: копирование, WhatsApp, Telegram и системное меню, если оно есть.
 * Сообщение уходит только после выбора адресата в выбранном приложении.
 */
export function RequestShareDialog({ target, onClose }: RequestShareDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canSystemShare = typeof navigator !== "undefined" && !!navigator.share;

  const copy = async () => {
    if (!target) return;
    let copied = false;
    try {
      await navigator.clipboard.writeText(target.url);
      copied = true;
    } catch {
      // Без доступа к буферу (http, старый браузер) — копируем выделенный текст поля.
      inputRef.current?.select();
      copied = document.execCommand?.("copy") ?? false;
    }
    toast(
      copied
        ? { variant: "success", title: "Ссылка скопирована", description: `Заявка #${target.requestId} — вставьте ссылку в сообщение.`, duration: 3000 }
        : { variant: "error", title: "Не удалось скопировать", description: "Выделите ссылку и скопируйте вручную.", duration: 5000 },
    );
  };

  const openExternal = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const systemShare = async () => {
    if (!target) return;
    try {
      await navigator.share({ title: target.text, text: target.text, url: target.url });
      onClose();
    } catch {
      // Отмена или запрет браузера — окно остаётся, можно скопировать ссылку.
    }
  };

  return (
    <Dialog open={target != null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-w-md border-[#3A3A3C] bg-[#1C1C1E] text-white sm:rounded-2xl p-6 gap-5 [&>button]:text-[#8E8E93] [&>button]:hover:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-bold text-white">Поделиться заявкой</DialogTitle>
          <DialogDescription className="text-sm text-[#8E8E93]">
            {target ? `Заявка #${target.requestId}. ` : ""}По ссылке заявку можно посмотреть без входа
            в Workflow, но не изменить.
          </DialogDescription>
        </DialogHeader>

        {target ? (
          <>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                readOnly
                value={target.url}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Ссылка на заявку"
                className="min-w-0 flex-1 rounded-xl border border-[#3A3A3C] bg-[#2C2C2E] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F35713]"
              />
              <button
                type="button"
                onClick={copy}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#F35713] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#F35713]/90"
              >
                <Copy className="h-4 w-4" />
                Копировать
              </button>
            </div>

            <div className={cn("grid gap-2", canSystemShare ? "grid-cols-3" : "grid-cols-2")}>
              <button
                type="button"
                className={OPTION_CLASS}
                onClick={() => openExternal(whatsAppShareUrl(requestShareMessage(target.requestId, target.url, target.title)))}
              >
                <span className="text-[#25D366]"><WhatsAppIcon /></span>
                WhatsApp
              </button>
              <button
                type="button"
                className={OPTION_CLASS}
                onClick={() => openExternal(telegramShareUrl(target.url, target.text))}
              >
                <Send className="h-5 w-5 text-[#2AABEE]" />
                Telegram
              </button>
              {canSystemShare ? (
                <button type="button" className={OPTION_CLASS} onClick={systemShare}>
                  <Share2 className="h-5 w-5" />
                  Другие
                </button>
              ) : null}
            </div>

            <p className="flex items-start gap-2 text-xs text-[#8E8E93]">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Сообщение не отправится само: адресата вы выберете в мессенджере.
            </p>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
