"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { ClientDesktopShell } from "@/components/layout/ClientDesktopShell";
import { ExecutorDesktopShell } from "@/components/layout/ExecutorDesktopShell";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";
import { useBottomAnchoredScroll } from "@/hooks/use-bottom-anchored-scroll";
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
import { CategoryEmptyState, CategoryIcon, NotificationText } from "./categories/category-visuals";

type NotificationsPageDesktopViewProps = UseNotificationsPageResult;

function wrapWithShell(role: string | undefined, children: React.ReactNode) {
  switch (role) {
    case "client":
      return <ClientDesktopShell>{children}</ClientDesktopShell>;
    case "executor":
      return <ExecutorDesktopShell>{children}</ExecutorDesktopShell>;
    case "admin-worker":
      return <RoleDesktopShell role="admin-worker">{children}</RoleDesktopShell>;
    case "manager":
      return <RoleDesktopShell role="manager">{children}</RoleDesktopShell>;
    case "department-head":
      return <RoleDesktopShell role="department-head">{children}</RoleDesktopShell>;
    default:
      return children;
  }
}

/** Запись ленты: длинный текст сворачивается до трёх строк, «Показать полностью» раскрывает его целиком. */
function HistoryCard({
  notification,
  onRead,
  onRequestClick,
}: {
  notification: CategoryNotification;
  onRead: (notification: CategoryNotification) => void;
  onRequestClick: (requestId: string) => void;
}) {
  const unread = !notification.is_read;
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (el && !expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [expanded, notification.content]);

  return (
    <article
      onClick={() => onRead(notification)}
      className={cn(
        "flex cursor-pointer flex-col gap-1 rounded-xl border p-4",
        unread
          ? "border-[#E85D2B]/30 bg-[linear-gradient(rgba(232,93,43,0.13),rgba(232,93,43,0.13)),#2C2C2E]"
          : "border-white/5 bg-[#212123]",
      )}
    >
      <div className="flex items-center gap-2">
        <h3 className={cn("min-w-0 flex-1 text-sm leading-[17px]", unread ? "font-semibold text-[#F5F5F7]" : "font-medium text-[#C7C7CC]")}>
          {notification.title}
        </h3>
        {unread && (
          <span className="shrink-0 rounded-full bg-[#E85D2B]/15 px-2 py-0.5 text-xs font-medium text-[#FF8A5B]">Новое</span>
        )}
        <span className="flex shrink-0 items-center gap-1 text-xs text-[#8E8E93]">
          <Clock className="h-3 w-3" aria-hidden />
          {formatTimeOnly(notification.created_at)}
        </span>
      </div>
      <p
        ref={textRef}
        className={cn(
          "mt-1 whitespace-pre-line text-sm leading-[22px]",
          unread ? "text-[#D1D1D6]" : "text-[#9A9AA0]",
          !expanded && "line-clamp-3",
        )}
      >
        <NotificationText
          notification={notification}
          onRequestClick={(requestId) => {
            onRead(notification);
            onRequestClick(requestId);
          }}
          linkClassName="text-[#FF8A5B]"
        />
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRead(notification);
            setExpanded((value) => !value);
          }}
          className="flex w-fit items-center gap-1 text-[13px] font-medium text-[#FF8A5B] hover:opacity-80"
          aria-expanded={expanded}
        >
          {expanded ? "Свернуть" : "Показать полностью"}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      )}
    </article>
  );
}

function CategoryHistoryPanel(page: NotificationsPageDesktopViewProps) {
  const { activeCategory, activeSummary, history, loadOlder, readNotification, handleRequestClick, retry } = page;
  const items = history?.items ?? [];
  const { containerRef, onScroll } = useBottomAnchoredScroll({
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
  const empty = !firstLoad && !history?.error && items.length === 0;

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-5">
      <header className="flex items-center gap-3">
        <CategoryIcon category={activeCategory} muted={empty} size="md" />
        <div>
          <h2 className="text-lg font-semibold leading-[21px] text-white">{meta.label}</h2>
          <p className={cn("text-[13px]", unread > 0 ? "text-[#E85D2B]" : "text-white/60")}>
            {unread > 0 ? formatUnreadLabel(unread) : items.length > 0 ? "Всё прочитано" : "Нет уведомлений"}
          </p>
        </div>
      </header>
      {firstLoad ? (
        <p className="py-12 text-center text-sm text-white/60">Загрузка...</p>
      ) : history?.error && items.length === 0 ? (
        <div className="py-12 text-center text-sm text-white/60">
          <p>{history.error}</p>
          <button type="button" onClick={retry} className="mt-3 font-medium text-[#E85D2B]">Повторить</button>
        </div>
      ) : empty ? (
        <CategoryEmptyState
          category={activeCategory}
          size="xl"
          className="rounded-xl border border-[#39393C] bg-[#2A2A2C] px-6 py-20"
        />
      ) : (
        <div ref={containerRef} onScroll={onScroll} className="max-h-[calc(100vh-290px)] min-h-[320px] overflow-y-auto pr-1">
          <div className="flex flex-col gap-5">
            {history?.loading && <p className="text-center text-xs text-white/50">Загрузка...</p>}
            {groups.map((group) => (
              <div key={group.key} className="flex flex-col gap-2">
                <h3 className="text-[13px] font-semibold text-white/50">{group.label}</h3>
                {group.items.map((notification) => (
                  <HistoryCard
                    key={notification.id}
                    notification={notification}
                    onRead={readNotification}
                    onRequestClick={handleRequestClick}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** Раздел «Уведомления» на Desktop: категории слева, история активной категории справа. */
export function NotificationsPageDesktopView(page: NotificationsPageDesktopViewProps) {
  const { user, categories, unreadCount, summaryLoading, summaryError, activeCategory, selectCategory, retry } = page;

  const content = (
    <div className="client-desktop-content client-desktop-dark mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Уведомления</h1>
        <p className="text-sm text-white/60">{unreadCount > 0 ? formatUnreadLabel(unreadCount) : "Все прочитаны"}</p>
      </div>
      {summaryLoading && categories.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/60">Загрузка...</p>
      ) : summaryError && categories.length === 0 ? (
        <div className="py-12 text-center text-sm text-white/60">
          <p>{summaryError}</p>
          <button type="button" onClick={retry} className="mt-3 font-medium text-[#E85D2B]">Повторить</button>
        </div>
      ) : (
        <div className="flex items-start gap-6">
          <div className="w-[340px] shrink-0">
            <NotificationCategoryList
              categories={categories}
              variant="page"
              activeCategory={activeCategory}
              onSelect={selectCategory}
            />
          </div>
          <CategoryHistoryPanel {...page} />
        </div>
      )}
    </div>
  );

  return wrapWithShell(user?.role, content);
}
