"use client";

import type { ReactNode, RefObject } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/requests/request-card";
import { RequestBulkDeleteBar, RequestSelectWrapper } from "@/components/requests/request-bulk-delete-bar";
import { RequestListFeedback, type RequestListFeedbackProps } from "@/components/requests/request-list-feedback";
import { MOBILE_REQUESTS_LOAD_MORE_BTN } from "@/constants/mobile-requests-ui";
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
  variant = "mobile",
  lastElementRef,
  clientRatings,
  bulkDelete,
}: RequestsListContentProps) {
  const isDesktop = variant === "desktop";
  const lastIndex = requests.length - 1;

  return (
    <>
      <RequestListFeedback
        loading={loading}
        error={error}
        isFiltered={isFiltered}
        onRetry={onRetry}
        onResetFilters={onResetFilters}
        count={requests.length}
        emptyMessage={emptyMessage}
      />
      {bulkDelete && !loading ? (
        <RequestBulkDeleteBar bulk={bulkDelete} visibleIds={requests.map((r) => r.id)} variant={variant} />
      ) : null}
      {requests.map((request, index) => (
        <RequestSelectWrapper key={request.id} bulk={bulkDelete} requestId={request.id}>
          <RequestCard
            request={request}
            onCardClick={() => (bulkDelete?.active ? bulkDelete.toggle(request.id) : onCardClick(request))}
            renderCardHeader={renderCardHeader}
            isLast={index === lastIndex}
            lastElementRef={index === lastIndex ? lastElementRef : null}
            clientRating={clientRatings?.[request.id]}
            userRole={userRole}
            variant="compact"
          />
        </RequestSelectWrapper>
      ))}
      {hasMore && (
        <div className={cn("flex justify-center pt-4", !isDesktop && "pb-2")}>
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading || loadingMore}
            className={isDesktop ? "border-white/20 bg-transparent text-white hover:bg-white/10" : MOBILE_REQUESTS_LOAD_MORE_BTN}
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
        </div>
      )}
    </>
  );
}
