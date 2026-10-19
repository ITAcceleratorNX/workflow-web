"use client";

import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { RequestDetails } from "@/components/requests";
import type { UseDepartmentHeadRequestsListResult } from "@/hooks/use-department-head-requests-list";
import { useDepartmentHeadRequestCardHeader } from "./department-head-request-card-header";
import { DepartmentHeadRequestsFilters } from "./department-head-requests-filters";
import { DepartmentHeadRequestsListContent } from "./department-head-requests-list-content";
import { DepartmentHeadRequestsRecurringTab } from "./department-head-requests-recurring-tab";
import { DepartmentHeadRequestsTabs } from "./department-head-requests-tabs";

type DepartmentHeadRequestsDesktopProps = UseDepartmentHeadRequestsListResult;

export function DepartmentHeadRequestsDesktop(props: DepartmentHeadRequestsDesktopProps) {
  const {
    activeTab,
    setActiveTab,
    filterIncomingStatus,
    setFilterIncomingStatus,
    filterIncomingType,
    setFilterIncomingType,
    statusFilterOptions,
    loading,
    loadingMore,
    hasMore,
    activeList,
    handleCardClick,
    displayRequest,
    handleClosePanel,
    handleRequestUpdated,
    handleLoadMore,
    handleDeleteRecurringTask,
    handleAssignExecutors,
    handleChangeExecutors,
    handleOpenRedirectModal,
  } = props;

  const renderCardHeader = useDepartmentHeadRequestCardHeader();

  const listContent =
    activeTab === "recurring" ? (
      <DepartmentHeadRequestsRecurringTab isDesktop onDeleteTask={handleDeleteRecurringTask} />
    ) : (
      <DepartmentHeadRequestsListContent
        variant="desktop"
        error={props.error}
              isFiltered={props.isFiltered}
              onRetry={props.handleRefresh}
              onResetFilters={props.resetFilters}
              loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        requests={activeList}
        activeTab={activeTab}
        onCardClick={handleCardClick}
        renderCardHeader={renderCardHeader}
        onLoadMore={handleLoadMore}
      />
    );

  return (
    <AdminManagerRequestsDesktopFrame
      filtersSlot={
        <DepartmentHeadRequestsFilters
          variant="desktop"
          filterStatus={activeTab === "my-requests" ? props.filterMyStatus : filterIncomingStatus}
          onFilterStatusChange={activeTab === "my-requests" ? props.setFilterMyStatus : setFilterIncomingStatus}
          filterType={activeTab === "my-requests" ? props.filterMyType : filterIncomingType}
          onFilterTypeChange={activeTab === "my-requests" ? props.setFilterMyType : setFilterIncomingType}
          statusFilterOptions={statusFilterOptions}
        />
      }
      tabsSlot={
        <DepartmentHeadRequestsTabs
          variant="desktop"
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      }
      listSlot={listContent}
      detailSlot={
        displayRequest ? (
          <RequestDetails
            request={displayRequest}
            onClose={handleClosePanel}
            onRequestUpdated={handleRequestUpdated}
            userRole="department-head"
            sourceTab={activeTab === "my-requests" ? "my-requests" : "incoming"}
            hideFullModeButton
            embedInPanel
            onAssignExecutor={handleAssignExecutors}
            onChangeExecutors={handleChangeExecutors}
            onRedirectToOtherDepartment={handleOpenRedirectModal}
          />
        ) : null
      }
      displayRequestId={displayRequest?.id}
      onCloseDetail={handleClosePanel}
    />
  );
}
