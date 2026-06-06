"use client";

import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { RequestDetails } from "@/components/requests";
import type { UseClientRequestsListResult } from "@/hooks/use-client-requests-list";
import { useClientRequestCardHeader } from "./client-request-card-header";
import { ClientRequestsFilters } from "./client-requests-filters";
import { ClientRequestsListContent } from "./client-requests-list-content";
import { ClientRequestsRatingModal } from "./client-requests-rating-modal";

type ClientRequestsDesktopProps = UseClientRequestsListResult;

export function ClientRequestsDesktop(props: ClientRequestsDesktopProps) {
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
    handleLoadMore,
    handleRequestUpdated,
    handleDeleteSubRequest,
    handleCardClick,
    displayRequest,
    handleClosePanel,
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
    <>
      <AdminManagerRequestsDesktopFrame
        filtersSlot={
          <ClientRequestsFilters
            variant="desktop"
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            statusFilterOptions={statusFilterOptions}
          />
        }
        listSlot={
          <ClientRequestsListContent
            variant="desktop"
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            requests={filteredRequests}
            clientRatings={clientRatings}
            onCardClick={handleCardClick}
            renderCardHeader={renderCardHeader}
            onLoadMore={handleLoadMore}
          />
        }
        detailSlot={
          displayRequest ? (
            <RequestDetails
              request={displayRequest}
              onClose={handleClosePanel}
              onRequestUpdated={handleRequestUpdated}
              sourceTab="my-requests"
              hideFullModeButton
              userRole="client"
              fullModeRedirectBase="/client"
              onDelete={handleDeleteSubRequest}
              onRateRequest={openRateModal}
              embedInPanel
            />
          ) : null
        }
        displayRequestId={displayRequest?.id}
        onCloseDetail={handleClosePanel}
      />
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
    </>
  );
}
