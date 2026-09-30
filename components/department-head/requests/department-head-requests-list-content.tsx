"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RequestListFeedback, type RequestListFeedbackProps } from "@/components/requests/request-list-feedback";
import type { RequestGroup } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/requests";
import { cn } from "@/lib/utils";
import {
  DEPARTMENT_HEAD_EMPTY_MESSAGES,
  type DepartmentHeadRequestsTab,
} from "./department-head-requests-constants";

interface DepartmentHeadRequestsListContentProps extends RequestListFeedbackProps {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  requests: RequestGroup[];
  activeTab: DepartmentHeadRequestsTab;
  onCardClick: (request: RequestGroup) => void;
  renderCardHeader: (request: RequestGroup) => React.ReactNode;
  onLoadMore: () => void;
  variant?: "mobile" | "desktop";
  lastElementRef?: React.RefObject<HTMLDivElement | null>;
}

export function DepartmentHeadRequestsListContent({
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
}: DepartmentHeadRequestsListContentProps) {
  const isDesktop = variant === "desktop";
  const emptyMessage = DEPARTMENT_HEAD_EMPTY_MESSAGES[activeTab] ?? "Нет заявок";

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
          userRole="department-head"
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
                : "w-full border-[#3A3A3C] text-white hover:bg-white/10"
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
