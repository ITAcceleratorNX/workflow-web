"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RequestListFeedback, type RequestListFeedbackProps } from "@/components/requests/request-list-feedback";
import type { RequestGroup } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/requests";
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
}: AdminWorkerRequestsListContentProps) {
  const isDesktop = variant === "desktop";
  const emptyMessage = ADMIN_WORKER_EMPTY_MESSAGES[activeTab] ?? "Нет заявок";

  return (
    <>
      <RequestListFeedback loading={loading} error={error} isFiltered={isFiltered} onRetry={onRetry} onResetFilters={onResetFilters} count={requests.length} emptyMessage={emptyMessage} />
      {requests.map((request, index) => (
        <RequestCard
          key={request.id}
          request={request}
          onCardClick={() => onCardClick(request)}
          renderCardHeader={renderCardHeader}
          isLast={index === requests.length - 1}
          lastElementRef={index === requests.length - 1 ? lastElementRef : null}
          userRole="admin-worker"
          variant="compact"
        />
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
