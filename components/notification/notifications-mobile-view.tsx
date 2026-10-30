"use client";

import { ArrowLeft } from "lucide-react";
import { RequestNotFoundModal } from "@/components/RequestNotFoundModal";
import { useNewestFirstScroll } from "@/hooks/use-newest-first-scroll";
import type { UseNotificationsPageResult } from "@/hooks/use-notifications-page";
import { cn } from "@/lib/utils";
import { formatTimeOnly } from "@/lib/dateTimeUtils";
import {
  NOTIFICATION_CATEGORY_META,
  formatUnreadLabel,
  groupNotificationsByDay,
  type CategoryNotification,
} from "@/lib/notification-categories";
import { NotificationCategoryList } from "./categories/category-list";
import { CategoryEmptyState } from "./categories/category-visuals";
import { NotificationDetailModal } from "./notification-detail-modal";

type NotificationsMobileViewProps = UseNotificationsPageResult;

function MobileHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <div className="flex shrink-0 items-center bg-black px-4 py-2">
      <button
        type="button"
        onClick={onBack}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10"
        aria-label="Назад"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col items-center text-center">
        <h1 className="truncate text-lg font-semibold leading-[21px] text-white">{title}</h1>
        {subtitle && <p className="mt-px text-xs text-[#F35713]">{subtitle}</p>}
      </div>
      <span className="w-11 shrink-0" aria-hidden />
    </div>
  );
}

function Status({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="py-12 text-center text-sm text-[#A1A1AA]">
      <p>{text}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 font-medium text-[#F35713]">
          Повторить
        </button>
      )}
    </div>
  );
}

function HistoryItem({ notification, onOpen }: { notification: CategoryNotification; onOpen: () => void }) {
  const unread = !notification.is_read;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn("flex w-full gap-2.5 py-3.5 pl-3 pr-4 text-left", unread && "bg-[#F35713]/10")}
    >
      <span className="flex w-2 shrink-0 justify-center pt-1.5" aria-hidden>
        {unread && <span className="h-2 w-2 rounded-full bg-[#F35713]" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-start gap-2">
          <span className={cn("flex-1 text-[15px] leading-5", unread ? "font-semibold text-white" : "font-medium text-[#D4D4D8]")}>
            {notification.title}
          </span>
          <span className="shrink-0 text-xs leading-5 text-[#A1A1AA]">{formatTimeOnly(notification.created_at)}</span>
        </span>
        <span className={cn("line-clamp-2 whitespace-pre-line text-sm leading-[19px]", unread ? "text-[#D4D4D8]" : "text-[#A1A1AA]")}>
          {notification.content}
        </span>
      </span>
      {unread && <span className="sr-only">Новое</span>}
    </button>
  );
}

function CategoryHistory(page: NotificationsMobileViewProps) {
  const { activeCategory, activeSummary, history, loadOlder, openNotification, backToCategories, retry } = page;
  const items = history?.items ?? [];
  const { containerRef, onScroll } = useNewestFirstScroll({
    resetKey: activeCategory,
    itemsCount: items.length,
    hasMore: history?.hasMore ?? false,
    loading: history?.loading ?? true,
    onLoadOlder: loadOlder,
  });
  if (!activeCategory) return null;
  const meta = NOTIFICATION_CATEGORY_META[activeCategory];
  const unread = activeSummary?.unread_count ?? 0;
  const groups = groupNotificationsByDay(items);
  const firstLoad = (!history || history.loading) && items.length === 0;

  return (
    <>
      <MobileHeader title={meta.label} subtitle={unread > 0 ? formatUnreadLabel(unread) : undefined} onBack={backToCategories} />
      <div ref={containerRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2 safe-area-bottom">
        {firstLoad ? (
          <Status text="Загрузка..." />
        ) : history?.error && items.length === 0 ? (
          <Status text={history.error} onRetry={retry} />
        ) : items.length === 0 ? (
          <CategoryEmptyState category={activeCategory} className="px-6 pb-12 pt-16" />
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <section key={group.key} className="flex flex-col gap-2">
                <h2 className="text-[13px] font-semibold text-[#A1A1AA]">{group.label}</h2>
                <div className="overflow-hidden rounded-[20px] bg-[#1C1C1E]">
                  {group.items.map((notification, index) => (
                    <div key={notification.id}>
                      {index > 0 && <div className="ml-[30px] h-px bg-white/[0.08]" aria-hidden />}
                      <HistoryItem notification={notification} onOpen={() => openNotification(notification)} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {history?.loading && <p className="text-center text-xs text-[#A1A1AA]">Загрузка...</p>}
          </div>
        )}
      </div>
    </>
  );
}

/** Mobile: экран категорий → история категории → полный текст в модальном окне. */
export function NotificationsMobileView(page: NotificationsMobileViewProps) {
  const {
    categories,
    summaryLoading,
    summaryError,
    activeCategory,
    selectCategory,
    selectedNotification,
    setSelectedNotification,
    showNotFoundModal,
    setShowNotFoundModal,
    notFoundRequestId,
    handleRequestClick,
    handleClose,
    retry,
  } = page;

  return (
    <div className="flex h-[100dvh] flex-col bg-black safe-area-top">
      {activeCategory ? (
        <CategoryHistory {...page} />
      ) : (
        <>
          <MobileHeader title="Уведомления" onBack={handleClose} />
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2 safe-area-bottom">
            {summaryLoading && categories.length === 0 ? (
              <Status text="Загрузка..." />
            ) : summaryError && categories.length === 0 ? (
              <Status text={summaryError} onRetry={retry} />
            ) : (
              <NotificationCategoryList categories={categories} variant="mobile" onSelect={selectCategory} />
            )}
          </div>
        </>
      )}

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onRequestClick={handleRequestClick}
      />
      <RequestNotFoundModal
        isOpen={showNotFoundModal}
        onClose={() => setShowNotFoundModal(false)}
        requestId={notFoundRequestId}
      />
    </div>
  );
}
