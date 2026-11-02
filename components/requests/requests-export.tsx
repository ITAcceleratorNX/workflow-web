"use client";

import { useState } from "react";
import { AlertTriangle, Check, Download, FileSpreadsheet, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  RQ_DESKTOP_BUTTON,
  RQ_DESKTOP_BUTTON_ICON,
  RQ_DESKTOP_POPOVER,
  rqDesktopNoticeClass,
} from "@/constants/requests-desktop-ui";
import type { RequestExportState } from "@/hooks/use-request-export";
import { formatRequestCount } from "@/lib/request-export";
import { cn } from "@/lib/utils";

interface RequestsExportButtonProps {
  /** Сколько заявок подходит под вкладку и фильтры — весь список, а не только показанные строки. */
  count: number;
  /** Список ещё загружается: выгружать нечего считать. */
  loading: boolean;
  /** «Teniz Towers · 30 сентября – 30 октября 2026 · Исполнение · все типы». */
  summary: string;
  /** «3 заявки · вкладка «Все»». */
  meta: string;
  preparing: boolean;
  onDownload: () => void;
}

/** «Экспорт в Excel»: окно с условиями выгрузки и «Скачать»; без заявок кнопка неактивна. */
export function RequestsExportButton({ count, loading, summary, meta, preparing, onDownload }: RequestsExportButtonProps) {
  const [open, setOpen] = useState(false);
  const disabled = loading || preparing || count === 0;

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-busy={preparing}
          title={!loading && count === 0 ? "Нет заявок для выгрузки" : undefined}
          className={cn(
            RQ_DESKTOP_BUTTON,
            "data-[state=open]:border-[#E85D2B] aria-busy:disabled:border-[#414143] aria-busy:disabled:text-[#D1D1D6]",
          )}
        >
          {preparing ? (
            <>
              <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-[#E85D2B] border-t-transparent" aria-hidden />
              Готовим файл…
            </>
          ) : (
            <>
              <Download className={RQ_DESKTOP_BUTTON_ICON} aria-hidden />
              Экспорт в Excel
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4} className={RQ_DESKTOP_POPOVER}>
        <div className="px-4 py-3.5">
          <p className="text-[13px] leading-[18px] text-[#A1A1A6]">Будут выгружены заявки по текущим фильтрам</p>
          <p className="mt-1.5 text-[15px] font-semibold leading-[21px]">{summary}</p>
          <p className="mt-1.5 text-[13px] leading-[18px] text-[#A1A1A6]">{meta}</p>
        </div>
        <div className="flex items-center gap-3 border-t border-[#3A3A3C] px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#3A2414]" aria-hidden>
            <FileSpreadsheet className="h-[18px] w-[18px] text-[#E85D2B]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold leading-5">Excel</span>
            <span className="block text-[13px] leading-[18px] text-[#A1A1A6]">Таблица с заявками, .xlsx</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDownload();
            }}
            className="inline-flex h-[34px] shrink-0 items-center gap-2 rounded-[10px] bg-[#E85D2B] px-3.5 text-[15px] font-semibold text-ui-fg transition-colors hover:bg-[#E85D2B]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
          >
            <Download className="h-4 w-4" aria-hidden />
            Скачать
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface RequestsExportNoticeProps {
  state: RequestExportState;
  onRetry: () => void;
  onDismiss: () => void;
}

function NoticeClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Закрыть уведомление"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#A1A1A6] transition-colors hover:bg-white/5 hover:text-ui-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
    >
      <X className="h-4 w-4" aria-hidden />
    </button>
  );
}

/** Итог выгрузки справа сверху: «Файл готов» с именем и числом заявок или ошибка с «Повторить». */
export function RequestsExportNotice({ state, onRetry, onDismiss }: RequestsExportNoticeProps) {
  if (state.status === "success") {
    return (
      <div role="status" className={rqDesktopNoticeClass("success")}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#12301E]" aria-hidden>
          <Check className="h-4 w-4 text-[#4ADE80]" strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[15px] font-semibold leading-5">Файл готов</p>
          <p className="mt-0.5 break-words text-[13px] leading-[18px] text-[#A1A1A6]">
            {state.fileName}
            {state.count !== null ? ` · ${formatRequestCount(state.count)}` : null}
          </p>
        </div>
        <NoticeClose onClick={onDismiss} />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div role="alert" className={rqDesktopNoticeClass("error")}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3A1414]" aria-hidden>
          <AlertTriangle className="h-4 w-4 text-[#F87171]" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[15px] font-semibold leading-5">Не удалось выгрузить файл</p>
          <p className="mt-0.5 text-[13px] leading-[18px] text-[#A1A1A6]">{state.message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded text-[15px] font-semibold text-[#E85D2B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D2B]/60"
          >
            Повторить
          </button>
        </div>
        <NoticeClose onClick={onDismiss} />
      </div>
    );
  }
  return null;
}
