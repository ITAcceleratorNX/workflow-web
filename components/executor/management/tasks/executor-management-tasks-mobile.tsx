"use client";

import { ExecutorMobileCardHeader } from "@/components/executor-mobile/ExecutorMobileCardHeader";
import { MobilePageLayout } from "@/components/layout/MobilePageLayout";
import type { RequestGroup } from "@/stores/useRequestStore";
import type { UseExecutorManagementTasksResult } from "@/hooks/use-executor-management-tasks";
import { EXECUTOR_MANAGEMENT_TASKS_BACK_HREF } from "@/hooks/use-executor-management-tasks";
import {
  EXECUTOR_REQUEST_TABS,
  type ExecutorRequestsTab,
} from "@/components/executor/requests/executor-requests-constants";
import { ExecutorRequestsFilters } from "@/components/executor/requests/executor-requests-filters";
import { ExecutorRequestsListContent } from "@/components/executor/requests/executor-requests-list-content";

type ExecutorManagementTasksMobileProps = UseExecutorManagementTasksResult;

function getPageTitle(tab: ExecutorRequestsTab): string {
  return EXECUTOR_REQUEST_TABS.find((item) => item.key === tab)?.label ?? "Заявки";
}

export function ExecutorManagementTasksMobile(props: ExecutorManagementTasksMobileProps) {
  const {
    tab,
    filterType,
    setFilterType,
    filterMyStatus,
    setFilterMyStatus,
    filterMyType,
    setFilterMyType,
    statusFilterOptions,
    loading,
    clientRatings,
    filteredList,
    handleRefresh,
    handleCardClick,
  } = props;

  const renderCardHeader = (requestGroup: RequestGroup) => (
    <ExecutorMobileCardHeader requestGroup={requestGroup} />
  );

  return (
    <MobilePageLayout
      title={getPageTitle(tab)}
      onRefresh={handleRefresh}
      backHref={EXECUTOR_MANAGEMENT_TASKS_BACK_HREF}
      gradient="plain"
    >
      <div className="space-y-4">
        <div className={tab === "myTasks" ? "flex flex-wrap gap-2" : "w-full"}>
          <ExecutorRequestsFilters
            variant="mobile"
            activeTab={tab}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            filterMyStatus={filterMyStatus}
            onFilterMyStatusChange={setFilterMyStatus}
            filterMyType={filterMyType}
            onFilterMyTypeChange={setFilterMyType}
            statusFilterOptions={statusFilterOptions}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <ExecutorRequestsListContent
            variant="mobile"
            loading={loading}
            requests={filteredList}
            activeTab={tab}
            clientRatings={clientRatings}
            onCardClick={handleCardClick}
            renderCardHeader={renderCardHeader}
          />
        </div>
      </div>
    </MobilePageLayout>
  );
}
