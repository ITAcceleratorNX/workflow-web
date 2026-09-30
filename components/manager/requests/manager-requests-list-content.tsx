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

interface ManagerRequestsListContentProps extends RequestListFeedbackProps {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  requests: RequestGroup[];
  onCardClick: (request: RequestGroup) => void;
  renderCardHeader: (request: RequestGroup) => React.ReactNode;
  onLoadMore: () => void;
  variant?: "mobile" | "desktop";
  lastElementRef?: React.RefObject<HTMLDivElement | null>;
}

export function ManagerRequestsListContent({
  loading,
  error,
  isFiltered,
  onRetry,
  onResetFilters,
  loadingMore,
  hasMore,
  requests,
  onCardClick,
  renderCardHeader,
  onLoadMore,
  variant = "mobile",
  lastElementRef,
}: ManagerRequestsListContentProps) {
  const isDesktop = variant === "desktop";

  return (
    <>
      <RequestListFeedback loading={loading} error={error} isFiltered={isFiltered} onRetry={onRetry} onResetFilters={onResetFilters} count={requests.length} />
      {requests.map((request, index) => (
        <RequestCard
          key={request.id}
          request={request}
          onCardClick={() => onCardClick(request)}
          renderCardHeader={renderCardHeader}
          isLast={index === requests.length - 1}
          lastElementRef={index === requests.length - 1 ? lastElementRef : null}
          userRole="manager"
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
                ? "bg-transparent border-white/20 text-white hover:bg-[#E04A0A]"
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
