"use client";

import PullToRefresh from "@/components/pull-to-refresh";
import { MobileCreateRequestButton, MobileRequestsTitle } from "@/components/requests/mobile-requests-chrome";
import { MOBILE_REQUESTS_PAGE_CLASS } from "@/constants/mobile-requests-ui";
import { cn } from "@/lib/utils";
import type { UseClientRequestsListResult } from "@/hooks/use-client-requests-list";
import { useClientRequestCardHeader } from "./client-request-card-header";
import { RequestStatusTypeFilters } from "@/components/requests/requests-filter-select";
import { RequestsListContent } from "@/components/requests/requests-list-content";
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
  });

  return (
    <PullToRefresh onRefresh={() => fetchRequests(1)}>
      <div className={cn(MOBILE_REQUESTS_PAGE_CLASS, "px-6 pt-[max(1rem,env(safe-area-inset-top))]")}>
        <MobileRequestsTitle />

        <div className="flex gap-3.5 mb-4">
          <RequestStatusTypeFilters
            mobileItemClassName="text-white"
            variant="mobile"
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            statusFilterOptions={statusFilterOptions}
          />
        </div>

        <MobileCreateRequestButton className="mb-4" />

        <div className="space-y-4">
          <RequestsListContent
            userRole="client"
            emptyMessage="У вас пока нет заявок"
            variant="mobile"
            error={props.error}
              isFiltered={props.isFiltered}
              onRetry={props.fetchRequests}
              onResetFilters={props.resetFilters}
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
