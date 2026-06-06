"use client";

import type { RequestGroup } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/requests";
import { cn } from "@/lib/utils";
import { EXECUTOR_EMPTY_MESSAGES, type ExecutorRequestsTab } from "./executor-requests-constants";

interface ExecutorRequestsListContentProps {
  loading: boolean;
  requests: RequestGroup[];
  activeTab: ExecutorRequestsTab;
  clientRatings: Record<number, any>;
  onCardClick: (request: RequestGroup) => void;
  renderCardHeader: (request: RequestGroup) => React.ReactNode;
  variant?: "mobile" | "desktop";
}

export function ExecutorRequestsListContent({
  loading,
  requests,
  activeTab,
  clientRatings,
  onCardClick,
  renderCardHeader,
  variant = "mobile",
}: ExecutorRequestsListContentProps) {
  const isDesktop = variant === "desktop";

  if (loading) {
    return (
      <div
        className={cn(
          "text-center py-12",
          isDesktop ? "text-white/60" : "py-8 text-gray-400"
        )}
      >
        Загрузка...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-12",
          isDesktop ? "text-white/60" : "py-8 text-gray-400"
        )}
      >
        {EXECUTOR_EMPTY_MESSAGES[activeTab]}
      </div>
    );
  }

  return (
    <>
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
    </>
  );
}
