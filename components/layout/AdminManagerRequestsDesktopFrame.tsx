"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { REQUESTS_DESKTOP_DARK_CLASS } from "@/constants/management-modal-ui";
import { RQ_DESKTOP_CREATE, RQ_DESKTOP_RESET, RQ_DESKTOP_TITLE } from "@/constants/requests-desktop-ui";
import { Plus, X } from "lucide-react";

export interface AdminManagerRequestsDesktopFrameProps {
  /** Фильтры списка; без них (журнал, логи) строки фильтров нет. */
  filtersSlot: React.ReactNode;
  /** Вкладки раздела (Все / Отклонённые / …). */
  tabsSlot?: React.ReactNode;
  /** «Сбросить» после фильтров — только когда какой-то фильтр выбран. */
  isFiltered?: boolean;
  onResetFilters?: () => void;
  /** Действия справа в строке фильтров («Экспорт в Excel»). */
  toolbarEndSlot?: React.ReactNode;
  /** Content for the list area */
  listSlot: React.ReactNode;
  /** Уведомления раздела (готов файл, ошибка выгрузки) — справа сверху. */
  noticeSlot?: React.ReactNode;
  /** Right panel content (RequestDetails) when a request is selected */
  detailSlot: React.ReactNode | null;
  /** Request ID for panel header */
  displayRequestId?: number;
  onCloseDetail: () => void;
}

/** Раздел «Заявки» на десктопе (все роли): заголовок, вкладки, фильтры, список и открытая заявка. */
export function AdminManagerRequestsDesktopFrame({
  filtersSlot,
  tabsSlot,
  isFiltered = false,
  onResetFilters,
  toolbarEndSlot,
  listSlot,
  noticeSlot,
  detailSlot,
  displayRequestId,
  onCloseDetail,
}: AdminManagerRequestsDesktopFrameProps) {
  const hasToolbar = Boolean(filtersSlot || toolbarEndSlot);

  return (
    // Высота окна минус шапка (h-16 + граница): страница не растёт по списку, поэтому список и
    // открытая заявка прокручиваются каждая в своей колонке — панель заявки остаётся на месте.
    <div className={`dark h-[calc(100dvh-4rem-1px)] flex bg-[#1A1A1A] ${REQUESTS_DESKTOP_DARK_CLASS}`}>
      <div className="relative flex-1 flex flex-col min-w-0">
        <div className="shrink-0 px-8 pt-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className={RQ_DESKTOP_TITLE}>Заявки</h1>
            <Button asChild className={RQ_DESKTOP_CREATE}>
              <Link href="/create-request">
                <Plus aria-hidden />
                Создать
              </Link>
            </Button>
          </div>
          {tabsSlot ? <div className="mt-4">{tabsSlot}</div> : null}
          {hasToolbar ? (
            // Перенос строки вместо обрезки на узком окне и при открытой заявке.
            <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
              {filtersSlot}
              {isFiltered && onResetFilters ? (
                <button type="button" onClick={onResetFilters} className={RQ_DESKTOP_RESET}>
                  <X aria-hidden />
                  Сбросить
                </button>
              ) : null}
              {toolbarEndSlot ? <div className="ml-auto">{toolbarEndSlot}</div> : null}
            </div>
          ) : null}
        </div>
        {/* relative: absolute-элементы карточек (sr-only) остаются внутри прокрутки и не растягивают страницу */}
        <div className="relative flex-1 overflow-auto min-h-0 px-8 pt-[18px] pb-8">{listSlot}</div>
        {noticeSlot ? (
          <div className="pointer-events-none absolute right-8 top-4 z-30 max-w-[calc(100%-4rem)]">{noticeSlot}</div>
        ) : null}
      </div>
      {detailSlot && (
        <div className="w-[420px] shrink-0 border-l border-white/10 flex flex-col bg-[#1A1A1A]">
          <div className="p-3 border-b border-white/10 flex justify-between items-center shrink-0">
            <span className="font-semibold text-white">
              Заявка #{displayRequestId}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white"
              onClick={onCloseDetail}
              aria-label="Закрыть заявку"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative flex-1 overflow-auto min-h-0">{detailSlot}</div>
        </div>
      )}
    </div>
  );
}
