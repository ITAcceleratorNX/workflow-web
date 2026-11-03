"use client";

import type { ReactNode, RefObject } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/requests/request-card";
import { RequestBulkDeleteBar, RequestSelectWrapper } from "@/components/requests/request-bulk-delete-bar";
import { RequestListFeedback, type RequestListFeedbackProps } from "@/components/requests/request-list-feedback";
import { MOBILE_REQUESTS_LOAD_MORE_BTN } from "@/constants/mobile-requests-ui";
import { RQ_DESKTOP_BUTTON, RQ_DESKTOP_LIST_DIVIDED } from "@/constants/requests-desktop-ui";
import type { RequestBulkDelete } from "@/hooks/use-request-bulk-delete";
import { cn } from "@/lib/utils";
import type { RequestGroup } from "@/stores/useRequestStore";

interface RequestsListContentProps extends RequestListFeedbackProps {
  /** Роль просматривающего: карточка показывает действия и оценки для неё. */
  userRole: "admin-worker" | "department-head" | "manager" | "executor" | "client";
  loading: boolean;
  loadingMore?: boolean;
  hasMore: boolean;
  requests: RequestGroup[];
  onCardClick: (request: RequestGroup) => void;
  renderCardHeader: (request: RequestGroup) => ReactNode;
  onLoadMore: () => void;
  emptyMessage?: string;
  /** Десктоп: подсказка в пустой выборке — какие фильтры есть у списка. */
  emptyFilteredHint?: string;
  variant?: "mobile" | "desktop";
  lastElementRef?: RefObject<HTMLDivElement | null>;
  /** Оценки клиента по заявкам (Клиент, Исполнитель). */
  clientRatings?: Record<number, unknown>;
  /** Выбор и логическое удаление заявок; без него карточки только открываются. */
  bulkDelete?: RequestBulkDelete;
}

/** Список заявок любой роли: состояние загрузки/ошибки/пусто, карточки и «Показать ещё». */
export function RequestsListContent({
  userRole,
  loading,
  error,
  isFiltered,
  onRetry,
  onResetFilters,
  loadingMore = false,
  hasMore,
  requests,
  onCardClick,
  renderCardHeader,
  onLoadMore,
  emptyMessage = "Нет заявок",
  emptyFilteredHint,
  variant = "mobile",
  lastElementRef,
  clientRatings,
  bulkDelete,
}: RequestsListContentProps) {
  const isDesktop = variant === "desktop";
  const lastIndex = requests.length - 1;
  const selecting = Boolean(bulkDelete?.active);

  const cards = requests.map((request, index) => (
    <RequestSelectWrapper key={request.id} bulk={bulkDelete} requestId={request.id} variant={variant}>
      <RequestCard
        request={request}
        onCardClick={() => (bulkDelete?.active ? bulkDelete.toggle(request.id) : onCardClick(request))}
        renderCardHeader={renderCardHeader}
        isLast={index === lastIndex}
        lastElementRef={index === lastIndex ? lastElementRef : null}
        clientRating={clientRatings?.[request.id]}
        userRole={userRole}
        variant={isDesktop ? "row" : "compact"}
      />
    </RequestSelectWrapper>
  ));

  return (
    <>
      <RequestListFeedback
        variant={variant}
        loading={loading}
        error={error}
        isFiltered={isFiltered}
        onRetry={onRetry}
        onResetFilters={onResetFilters}
        count={requests.length}
        emptyMessage={emptyMessage}
        emptyFilteredHint={emptyFilteredHint}
      />
      {bulkDelete && !loading ? (
        <RequestBulkDeleteBar bulk={bulkDelete} visibleIds={requests.map((r) => r.id)} variant={variant} />
      ) : null}
      {isDesktop ? (
        // В режиме выбора строки — отдельные плашки с рамкой выбора, без линий между ними.
        <div className={selecting ? "flex flex-col gap-1.5" : RQ_DESKTOP_LIST_DIVIDED}>{cards}</div>
      ) : (
        cards
      )}
      {hasMore && (
        <div className={cn("flex justify-center pt-4", !isDesktop && "pb-2")}>
          {isDesktop ? (
            <button type="button" onClick={onLoadMore} disabled={loading || loadingMore} className={RQ_DESKTOP_BUTTON}>
              {loadingMore ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Показать ещё
            </button>
          ) : (
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={loading || loadingMore}
              className={MOBILE_REQUESTS_LOAD_MORE_BTN}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                "Показать ещё"
              )}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
