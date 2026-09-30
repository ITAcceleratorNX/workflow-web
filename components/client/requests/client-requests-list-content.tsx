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

interface ClientRequestsListContentProps extends RequestListFeedbackProps {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  requests: RequestGroup[];
  clientRatings: Record<number, any>;
  onCardClick: (request: RequestGroup) => void;
  renderCardHeader: (request: RequestGroup) => React.ReactNode;
  onLoadMore: () => void;
  variant?: "mobile" | "desktop";
}

export function ClientRequestsListContent({
  loading,
  error,
  isFiltered,
  onRetry,
  onResetFilters,
  loadingMore,
  hasMore,
  requests,
  clientRatings,
  onCardClick,
  renderCardHeader,
  onLoadMore,
  variant = "mobile",
}: ClientRequestsListContentProps) {
  const isDesktop = variant === "desktop";

  return (
    <>
      <RequestListFeedback loading={loading} error={error} isFiltered={isFiltered} onRetry={onRetry} onResetFilters={onResetFilters} count={requests.length} emptyMessage={"У вас пока нет заявок"} />
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          onCardClick={onCardClick}
          renderCardHeader={renderCardHeader}
          clientRating={clientRatings[request.id]}
          userRole="client"
          variant="compact"
        />
      ))}
      {hasMore && (
        <div className={cn("flex justify-center pt-4", !isDesktop && "pb-2")}>
          <Button
            variant="outline"
            className={
              isDesktop
                ? "border-white/20 text-white hover:bg-white/10"
                : MOBILE_REQUESTS_LOAD_MORE_BTN
            }
            onClick={onLoadMore}
            disabled={loading || loadingMore}
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
