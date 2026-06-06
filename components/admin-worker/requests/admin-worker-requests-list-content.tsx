"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { RequestGroup } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/requests";
import { cn } from "@/lib/utils";
import {
  ADMIN_WORKER_EMPTY_MESSAGES,
  type AdminWorkerRequestsTab,
} from "./admin-worker-requests-constants";

interface AdminWorkerRequestsListContentProps {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  requests: RequestGroup[];
  activeTab: AdminWorkerRequestsTab;
  onCardClick: (request: RequestGroup) => void;
  renderCardHeader: (request: RequestGroup) => React.ReactNode;
  onLoadMore: () => void;
  variant?: "mobile" | "desktop";
  lastElementRef?: React.RefObject<HTMLDivElement>;
}

export function AdminWorkerRequestsListContent({
  loading,
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
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
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
            disabled={loadingMore}
            className={
              isDesktop
                ? "border-white/20 text-white hover:bg-white/10"
                : "bg-[#2C2C2E] border-[#3A3A3C] text-white hover:bg-[#3D3D3D]"
            }
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              "Загрузить ещё"
            )}
          </Button>
        </div>
      )}
    </>
  );
}
