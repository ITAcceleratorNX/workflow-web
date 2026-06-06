"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { RequestGroup } from "@/stores/useRequestStore";
import { RequestCard } from "@/components/requests";
import { cn } from "@/lib/utils";

interface ClientRequestsListContentProps {
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

  return (
    <>
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
      {requests.length === 0 && (
        <div
          className={cn(
            "text-center py-12",
            isDesktop ? "text-white/60" : "py-8 text-gray-400"
          )}
        >
          У вас пока нет заявок
        </div>
      )}
      {hasMore && requests.length > 0 && (
        <div className={cn("flex justify-center pt-4", !isDesktop && "pb-2")}>
          <Button
            variant="outline"
            className={
              isDesktop
                ? "border-white/20 text-white hover:bg-white/10"
                : "bg-[#2C2C2E] border-[#3A3A3C] text-white hover:bg-[#3D3D3D]"
            }
            onClick={onLoadMore}
            disabled={loadingMore}
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
