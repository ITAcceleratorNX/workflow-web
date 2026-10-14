"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RequestListFeedback, type RequestListFeedbackProps } from "@/components/requests/request-list-feedback";
import type { RequestGroup } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/requests";
import { RequestBulkDeleteBar, RequestSelectWrapper } from "@/components/requests/request-bulk-delete-bar";
import type { RequestBulkDelete } from "@/hooks/use-request-bulk-delete";
import {
  MOBILE_REQUESTS_LOAD_MORE_BTN,
} from "@/constants/mobile-requests-ui";
import { cn } from "@/lib/utils";
import {
  ADMIN_WORKER_EMPTY_MESSAGES,
  type AdminWorkerRequestsTab,
} from "./admin-worker-requests-constants";

interface AdminWorkerRequestsListContentProps extends RequestListFeedbackProps {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  requests: RequestGroup[];
  activeTab: AdminWorkerRequestsTab;
  onCardClick: (request: RequestGroup) => void;
  renderCardHeader: (request: RequestGroup) => React.ReactNode;
  onLoadMore: () => void;
  variant?: "mobile" | "desktop";
  lastElementRef?: React.RefObject<HTMLDivElement | null>;
  /** Выбор и удаление заявок; без него карточки только открываются. */
  bulkDelete?: RequestBulkDelete;
}

export function AdminWorkerRequestsListContent({
  loading,
  error,
  isFiltered,
  onRetry,
  onResetFilters,
  loadingMore,
  hasMore,
  requests,
  activeTab,
  onCardClick,
  renderCardHeader,
  onLoadMore,
  variant = "mobile",
  lastElementRef,
  bulkDelete,
}: AdminWorkerRequestsListContentProps) {
  const isDesktop = variant === "desktop";
  const emptyMessage = ADMIN_WORKER_EMPTY_MESSAGES[activeTab] ?? "Нет заявок";

  return (
    <>
      <RequestListFeedback loading={loading} error={error} isFiltered={isFiltered} onRetry={onRetry} onResetFilters={onResetFilters} count={requests.length} emptyMessage={emptyMessage} />
      {bulkDelete && !loading ? (
        <RequestBulkDeleteBar bulk={bulkDelete} visibleIds={requests.map((r) => r.id)} variant={variant} />
      ) : null}
      {requests.map((request, index) => (
        <RequestSelectWrapper key={request.id} bulk={bulkDelete} requestId={request.id}>
          <RequestCard
            request={request}
            onCardClick={() => (bulkDelete?.active ? bulkDelete.toggle(request.id) : onCardClick(request))}
            renderCardHeader={renderCardHeader}
            isLast={index === requests.length - 1}
            lastElementRef={index === requests.length - 1 ? lastElementRef : null}
            userRole="admin-worker"
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
            className={
              isDesktop
                ? "border-white/20 text-white hover:bg-white/10"
                : MOBILE_REQUESTS_LOAD_MORE_BTN
            }
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
