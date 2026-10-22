"use client";

import PullToRefresh from "@/components/pull-to-refresh";
import { MobileCreateRequestButton, MobileRequestsTitle } from "@/components/requests/mobile-requests-chrome";
import { MOBILE_REQUESTS_PAGE_CLASS } from "@/constants/mobile-requests-ui";
import { cn } from "@/lib/utils";
import type { UseManagerRequestsListResult } from "@/hooks/use-manager-requests-list";
import { RequestsTabs } from "@/components/requests/requests-tabs";
import { useManagerRequestCardHeader } from "./manager-request-card-header";
import { ManagerRequestsFilters } from "./manager-requests-filters";
import { RequestsListContent } from "@/components/requests/requests-list-content";
import { ManagerDeletionAuditList } from "./manager-deletion-audit-list";
import { MANAGER_REQUEST_TABS } from "./manager-requests-constants";

type ManagerRequestsMobileProps = UseManagerRequestsListResult;

/** Mobile list — parity с workflow-mobile requests index (manager). */
export function ManagerRequestsMobile(props: ManagerRequestsMobileProps) {
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
    handleRefresh,
    handleCardClick,
    handleLoadMore,
    lastElementRef,
  } = props;

  const renderCardHeader = useManagerRequestCardHeader();

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div
          className={cn(MOBILE_REQUESTS_PAGE_CLASS, "px-6 pt-[max(1rem,env(safe-area-inset-top))]")}>
          <MobileRequestsTitle />
          <MobileCreateRequestButton className="mb-4" />

          <RequestsTabs tabs={MANAGER_REQUEST_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "deleted" ? (
            <div className="mt-4 pb-40">
              <ManagerDeletionAuditList variant="mobile" />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-1">
                <ManagerRequestsFilters
                  variant="mobile"
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
              </div>

              <div className="space-y-4 pb-40">
                <RequestsListContent
                  userRole="manager"
                  variant="mobile"
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
                  lastElementRef={lastElementRef}
                  bulkDelete={bulkDelete}
                  emptyMessage={activeTab === "rejected" ? "Отклонённых заявок нет" : undefined}
                />
              </div>
            </div>
          )}
        </div>
      </PullToRefresh>
    </>
  );
}
