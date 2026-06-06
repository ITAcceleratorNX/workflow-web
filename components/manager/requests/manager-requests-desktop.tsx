"use client";

import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { RequestDetails } from "@/components/requests";
import type { UseManagerRequestsListResult } from "@/hooks/use-manager-requests-list";
import { useManagerRequestCardHeader } from "./manager-request-card-header";
import { ManagerRequestsFilters } from "./manager-requests-filters";
import { ManagerRequestsListContent } from "./manager-requests-list-content";

type ManagerRequestsDesktopProps = UseManagerRequestsListResult;

export function ManagerRequestsDesktop(props: ManagerRequestsDesktopProps) {
  const {
    offices,
    office,
    setOffice,
    period,
    setPeriod,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    statusFilterOptions,
    loading,
    loadingMore,
    hasMore,
    filteredRequests,
    handleCardClick,
    displayRequest,
    handleClosePanel,
    handleRequestUpdated,
    handleLoadMore,
  } = props;

  const renderCardHeader = useManagerRequestCardHeader();

  return (
    <AdminManagerRequestsDesktopFrame
      filtersSlot={
        <ManagerRequestsFilters
          variant="desktop"
          office={office}
          onOfficeChange={setOffice}
          period={period}
          onPeriodChange={setPeriod}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          offices={offices}
          statusFilterOptions={statusFilterOptions}
        />
      }
      listSlot={
        <ManagerRequestsListContent
          variant="desktop"
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          requests={filteredRequests}
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
            userRole="manager"
            sourceTab="myTasks"
            hideFullModeButton
            embedInPanel
          />
        ) : null
      }
      displayRequestId={displayRequest?.id}
      onCloseDetail={handleClosePanel}
    />
  );
}
