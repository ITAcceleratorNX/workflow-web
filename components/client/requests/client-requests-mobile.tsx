"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { MOBILE_REQUESTS_PAGE_CLASS } from "@/constants/mobile-requests-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UseClientRequestsListResult } from "@/hooks/use-client-requests-list";
import { useClientRequestCardHeader } from "./client-request-card-header";
import { ClientRequestsFilters } from "./client-requests-filters";
import { ClientRequestsListContent } from "./client-requests-list-content";
import { ClientRequestsRatingModal } from "./client-requests-rating-modal";

type ClientRequestsMobileProps = UseClientRequestsListResult;

/** Mobile list — parity с workflow-mobile `(tabs)/requests/index.tsx` (client). */
export function ClientRequestsMobile(props: ClientRequestsMobileProps) {
  const {
    statusFilterOptions,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    loading,
    loadingMore,
    hasMore,
    filteredRequests,
    clientRatings,
    fetchRequests,
    handleLoadMore,
    handleDeleteSubRequest,
    handleCardClick,
    openRateModal,
    showRatingModal,
    requestToRate,
    ratingValue,
    setRatingValue,
    ratingComment,
    setRatingComment,
    closeRateModal,
    handleRateExecutor,
    userRatings,
    isDesktop,
  } = props;

  const renderCardHeader = useClientRequestCardHeader({
    isDesktop,
    onViewDetails: handleCardClick,
    onRateRequest: openRateModal,
    onDelete: handleDeleteSubRequest,
  });

  return (
    <PullToRefresh onRefresh={() => fetchRequests(1)}>
      <div className={cn(MOBILE_REQUESTS_PAGE_CLASS, "px-4 pt-[max(1rem,env(safe-area-inset-top))]")}>
        <h1 className="text-2xl font-bold text-foreground mb-4">Заявки</h1>

        <div className="flex gap-2 mb-4">
          <ClientRequestsFilters
            variant="mobile"
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            statusFilterOptions={statusFilterOptions}
          />
        </div>

        <Link href="/create-request" className="block mb-4">
          <Button className="w-full h-12 bg-[#E85D2B] hover:bg-[#D94F15] text-white font-semibold rounded-2xl">
            <Plus className="h-4 w-4 mr-2" />
            Создать
          </Button>
        </Link>

        <div className="space-y-4">
          <ClientRequestsListContent
            variant="mobile"
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            requests={filteredRequests}
            clientRatings={clientRatings}
            onCardClick={handleCardClick}
            renderCardHeader={renderCardHeader}
            onLoadMore={handleLoadMore}
          />
        </div>

        <ClientRequestsRatingModal
          isOpen={showRatingModal}
          requestToRate={requestToRate}
          ratingValue={ratingValue}
          onRatingChange={setRatingValue}
          ratingComment={ratingComment}
          onCommentChange={setRatingComment}
          onClose={closeRateModal}
          onSubmit={handleRateExecutor}
          userRatings={userRatings}
        />
      </div>
    </PullToRefresh>
  );
}
