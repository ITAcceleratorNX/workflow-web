"use client";

import { RequestListFeedback, type RequestListFeedbackProps } from "@/components/requests/request-list-feedback";
import type { RequestGroup } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/requests";
import { Button } from "@/components/ui/button";
import { EXECUTOR_EMPTY_MESSAGES, type ExecutorRequestsTab } from "./executor-requests-constants";

interface ExecutorRequestsListContentProps extends RequestListFeedbackProps {
  loading: boolean;
  requests: RequestGroup[];
  activeTab: ExecutorRequestsTab;
  clientRatings: Record<number, any>;
  onCardClick: (request: RequestGroup) => void;
  renderCardHeader: (request: RequestGroup) => React.ReactNode;
  variant?: "mobile" | "desktop";
  hasMore: boolean;
  onLoadMore: () => void;
}

export function ExecutorRequestsListContent({
  loading,
  error,
  isFiltered,
  onRetry,
  onResetFilters,
  requests,
  activeTab,
  clientRatings,
  onCardClick,
  renderCardHeader,
  hasMore,
  onLoadMore,
}: ExecutorRequestsListContentProps) {
  return (
    <>
      <RequestListFeedback loading={loading} error={error} isFiltered={isFiltered} onRetry={onRetry} onResetFilters={onResetFilters} count={requests.length} emptyMessage={EXECUTOR_EMPTY_MESSAGES[activeTab]} />
      {requests.map((request, index) => (
        <RequestCard
          key={request.id || index}
          request={request}
          onCardClick={() => onCardClick(request)}
          renderCardHeader={renderCardHeader}
          clientRating={clientRatings[request.id]}
          userRole="executor"
          variant="compact"
        />
      ))}
      {hasMore && <div className="flex justify-center py-4"><Button variant="outline" disabled={loading} onClick={onLoadMore}>Показать ещё</Button></div>}
    </>
  );
}
