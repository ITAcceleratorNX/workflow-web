"use client";

import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { RequestDetails } from "@/components/requests";
import { RequestsTabs } from "@/components/requests/requests-tabs";
import type { UseManagerRequestsListResult } from "@/hooks/use-manager-requests-list";
import { useManagerRequestCardHeader } from "./manager-request-card-header";
import { ManagerRequestsFilters } from "./manager-requests-filters";
import { ManagerRequestsListContent } from "./manager-requests-list-content";
import { ManagerDeletionAuditList } from "./manager-deletion-audit-list";
import { MANAGER_REQUEST_TABS } from "./manager-requests-constants";

type ManagerRequestsDesktopProps = UseManagerRequestsListResult;

export function ManagerRequestsDesktop(props: ManagerRequestsDesktopProps) {
  const {
    activeTab,
    setActiveTab,
    bulkDelete,
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

  const showRequestList = activeTab !== "deleted";

  return (
    <AdminManagerRequestsDesktopFrame
      filtersSlot={
        showRequestList ? (
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
            hideStatusFilter={activeTab === "rejected"}
          />
        ) : null
      }
      tabsSlot={
        <RequestsTabs variant="desktop" tabs={MANAGER_REQUEST_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      }
      listSlot={
        showRequestList ? (
          <ManagerRequestsListContent
            variant="desktop"
            error={props.error}
            isFiltered={props.isFiltered}
            onRetry={props.handleRefresh}
            onResetFilters={props.resetFilters}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            requests={filteredRequests}
            onCardClick={handleCardClick}
            renderCardHeader={renderCardHeader}
            onLoadMore={handleLoadMore}
            bulkDelete={bulkDelete}
            emptyMessage={activeTab === "rejected" ? "Отклонённых заявок нет" : undefined}
          />
        ) : (
          <ManagerDeletionAuditList variant="desktop" />
        )
      }
      detailSlot={
        displayRequest && showRequestList ? (
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
