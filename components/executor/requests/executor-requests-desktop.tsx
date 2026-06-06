"use client";

import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { ExecutorDesktopShell } from "@/components/layout/ExecutorDesktopShell";
import { RequestDetails } from "@/components/requests";
import type { UseExecutorRequestsListResult } from "@/hooks/use-executor-requests-list";
import { useExecutorRequestCardHeader } from "./executor-request-card-header";
import { ExecutorRequestsFilters } from "./executor-requests-filters";
import { ExecutorRequestsListContent } from "./executor-requests-list-content";
import { ExecutorRequestsModals } from "./executor-requests-modals";
import { ExecutorRequestsTabs } from "./executor-requests-tabs";

type ExecutorRequestsDesktopProps = UseExecutorRequestsListResult;

export function ExecutorRequestsDesktop(props: ExecutorRequestsDesktopProps) {
  const {
    activeTab,
    setActiveTab,
    filterType,
    setFilterType,
    filterMyStatus,
    setFilterMyStatus,
    filterMyType,
    setFilterMyType,
    statusFilterOptions,
    loading,
    clientRatings,
    activeList,
    handleCardClick,
    displayRequest,
    handleClosePanel,
    handleRequestUpdated,
    handleStartTask,
    handleCompleteTask,
    handleRejectSubRequest,
    handleOpenRedirectModal,
    getSourceTab,
    ...modalProps
  } = props;

  const renderCardHeader = useExecutorRequestCardHeader();

  return (
    <ExecutorDesktopShell>
      <div className="client-desktop-content h-full">
        <AdminManagerRequestsDesktopFrame
          filtersSlot={
            <ExecutorRequestsFilters
              variant="desktop"
              activeTab={activeTab}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              filterMyStatus={filterMyStatus}
              onFilterMyStatusChange={setFilterMyStatus}
              filterMyType={filterMyType}
              onFilterMyTypeChange={setFilterMyType}
              statusFilterOptions={statusFilterOptions}
            />
          }
          tabsSlot={
            <ExecutorRequestsTabs
              variant="desktop"
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          }
          listSlot={
            <ExecutorRequestsListContent
              variant="desktop"
              loading={loading}
              requests={activeList}
              activeTab={activeTab}
              clientRatings={clientRatings}
              onCardClick={handleCardClick}
              renderCardHeader={renderCardHeader}
            />
          }
          detailSlot={
            displayRequest ? (
              <RequestDetails
                request={displayRequest}
                onClose={handleClosePanel}
                onRequestUpdated={handleRequestUpdated}
                sourceTab={getSourceTab()}
                hideFullModeButton
                userRole="executor"
                fullModeRedirectBase="/executor"
                onStartTask={handleStartTask}
                onCompleteTask={handleCompleteTask}
                onReject={handleRejectSubRequest}
                onRedirectToOtherDepartment={handleOpenRedirectModal}
                embedInPanel
              />
            ) : null
          }
          displayRequestId={displayRequest?.id}
          onCloseDetail={handleClosePanel}
        />
      </div>
      <ExecutorRequestsModals {...modalProps} categories={props.categories} />
    </ExecutorDesktopShell>
  );
}
