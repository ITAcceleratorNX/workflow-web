"use client";

import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { RequestDetails } from "@/components/requests";
import type { UseAdminWorkerRequestsListResult } from "@/hooks/use-admin-worker-requests-list";
import { useAdminWorkerRequestCardHeader } from "./admin-worker-request-card-header";
import { AdminWorkerRequestsFilters } from "./admin-worker-requests-filters";
import { AdminWorkerRequestsListContent } from "./admin-worker-requests-list-content";
import { AdminWorkerRequestsRecurringTab } from "./admin-worker-requests-recurring-tab";
import { AdminWorkerRequestsTabs } from "./admin-worker-requests-tabs";

type AdminWorkerRequestsDesktopProps = UseAdminWorkerRequestsListResult;

export function AdminWorkerRequestsDesktop(props: AdminWorkerRequestsDesktopProps) {
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
  } = props;

  const renderCardHeader = useAdminWorkerRequestCardHeader();

  const listContent =
    activeTab === "recurring" ? (
      <AdminWorkerRequestsRecurringTab isDesktop onDeleteTask={handleDeleteRecurringTask} />
    ) : (
      <AdminWorkerRequestsListContent
        variant="desktop"
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
        <AdminWorkerRequestsFilters
          variant="desktop"
          filterStatus={filterIncomingStatus}
          onFilterStatusChange={setFilterIncomingStatus}
          filterType={filterIncomingType}
          onFilterTypeChange={setFilterIncomingType}
          statusFilterOptions={statusFilterOptions}
        />
      }
      tabsSlot={
        <AdminWorkerRequestsTabs
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
            userRole="admin-worker"
            sourceTab="incoming"
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
