"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { MOBILE_REQUESTS_PAGE_CLASS } from "@/constants/mobile-requests-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UseAdminWorkerRequestsListResult } from "@/hooks/use-admin-worker-requests-list";
import { useAdminWorkerRequestCardHeader } from "./admin-worker-request-card-header";
import {
  ADMIN_WORKER_TAB_TITLES,
  type AdminWorkerRequestsTab,
} from "./admin-worker-requests-constants";
import { AdminWorkerRequestsFilters } from "./admin-worker-requests-filters";
import { AdminWorkerRequestsListContent } from "./admin-worker-requests-list-content";
import { AdminWorkerRequestsRecurringTab } from "./admin-worker-requests-recurring-tab";
import { AdminWorkerRequestsTabs } from "./admin-worker-requests-tabs";

type AdminWorkerRequestsMobileProps = UseAdminWorkerRequestsListResult;

/** Mobile list — parity с workflow-mobile requests index (admin-worker). */
export function AdminWorkerRequestsMobile(props: AdminWorkerRequestsMobileProps) {
  const {
    activeTab,
    setActiveTab,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    filterOffice,
    setFilterOffice,
    offices,
    statusFilterOptions,
    loading,
    loadingMore,
    hasMore,
    filteredIncomingRequests,
    filteredMyRequests,
    handleRefresh,
    handleCardClick,
    handleLoadMore,
    handleDeleteRecurringTask,
    lastElementRef,
  } = props;

  const renderCardHeader = useAdminWorkerRequestCardHeader();

  const tabRequests =
    activeTab === "incoming"
      ? filteredIncomingRequests
      : activeTab === "my-requests"
        ? filteredMyRequests
        : [];

  const tabTitle =
    activeTab === "recurring"
      ? ADMIN_WORKER_TAB_TITLES.recurring
      : ADMIN_WORKER_TAB_TITLES[activeTab as Exclude<AdminWorkerRequestsTab, "recurring">];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className={cn(MOBILE_REQUESTS_PAGE_CLASS, "px-4 pt-[max(1rem,env(safe-area-inset-top))]")}>
        <h1 className="text-2xl font-bold text-foreground mb-4">Заявки</h1>

        <AdminWorkerRequestsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab !== "recurring" && (
          <div className="mt-4">
            <AdminWorkerRequestsFilters
              variant="mobile"
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              filterOffice={filterOffice}
              onFilterOfficeChange={setFilterOffice}
              offices={offices}
              statusFilterOptions={statusFilterOptions}
            />
          </div>
        )}

        <div className="mt-4 space-y-4">
          <Link href="/create-request" className="block">
            <Button className="w-full h-12 bg-[#F35713] hover:bg-[#E04A0A] text-white font-semibold rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              Создать
            </Button>
          </Link>

          {activeTab === "recurring" ? (
            <div className="space-y-4 admin-management-content pb-8">
              <h2 className="text-lg font-bold text-foreground">{tabTitle}</h2>
              <AdminWorkerRequestsRecurringTab
                isDesktop={false}
                onDeleteTask={handleDeleteRecurringTask}
              />
            </div>
          ) : (
            <div className="space-y-4 pb-40">
              <h2 className="text-lg font-bold text-foreground">{tabTitle}</h2>
              <AdminWorkerRequestsListContent
                variant="mobile"
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                requests={tabRequests}
                activeTab={activeTab}
                onCardClick={handleCardClick}
                renderCardHeader={renderCardHeader}
                onLoadMore={handleLoadMore}
                lastElementRef={lastElementRef}
              />
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
