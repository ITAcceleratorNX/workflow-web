"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { Button } from "@/components/ui/button";
import {
  MOBILE_PAGE_GRADIENTS,
} from "@/constants/mobile-layout";
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

function MobileTabPanel({
  activeTab,
  title,
  filterStatus,
  onFilterStatusChange,
  filterType,
  onFilterTypeChange,
  statusFilterOptions,
  loading,
  loadingMore,
  hasMore,
  requests,
  onCardClick,
  renderCardHeader,
  onLoadMore,
  lastElementRef,
}: {
  activeTab: AdminWorkerRequestsTab;
  title: string;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  statusFilterOptions: { value: string; label: string }[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  requests: UseAdminWorkerRequestsListResult["activeList"];
  onCardClick: UseAdminWorkerRequestsListResult["handleCardClick"];
  renderCardHeader: ReturnType<typeof useAdminWorkerRequestCardHeader>;
  onLoadMore: () => void;
  lastElementRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="flex gap-2">
        <AdminWorkerRequestsFilters
          variant="mobile"
          filterStatus={filterStatus}
          onFilterStatusChange={onFilterStatusChange}
          filterType={filterType}
          onFilterTypeChange={onFilterTypeChange}
          statusFilterOptions={statusFilterOptions}
        />
      </div>
      <div className="space-y-4 pb-40">
        <AdminWorkerRequestsListContent
          variant="mobile"
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          requests={requests}
          activeTab={activeTab}
          onCardClick={onCardClick}
          renderCardHeader={renderCardHeader}
          onLoadMore={onLoadMore}
          lastElementRef={lastElementRef}
        />
      </div>
    </div>
  );
}

/** Mobile list — parity с workflow-mobile requests index (admin-worker). */
export function AdminWorkerRequestsMobile(props: AdminWorkerRequestsMobileProps) {
  const {
    activeTab,
    setActiveTab,
    filterMyStatus,
    setFilterMyStatus,
    filterMyType,
    setFilterMyType,
    filterIncomingStatus,
    setFilterIncomingStatus,
    filterIncomingType,
    setFilterIncomingType,
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

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div
        className="min-h-screen px-4 pt-[max(1rem,env(safe-area-inset-top))]"
        style={{
          background: MOBILE_PAGE_GRADIENTS.plain
        }}
      >
        <h1 className="text-2xl font-bold text-white mb-4">Заявки</h1>

        <AdminWorkerRequestsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-4 space-y-4">
          <Link href="/create-request" className="block">
            <Button className="w-full h-12 bg-[#F35713] hover:bg-[#E04A0A] text-white font-semibold rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              Создать
            </Button>
          </Link>

          {activeTab === "incoming" && (
            <MobileTabPanel
              activeTab="incoming"
              title={ADMIN_WORKER_TAB_TITLES.incoming}
              filterStatus={filterIncomingStatus}
              onFilterStatusChange={setFilterIncomingStatus}
              filterType={filterIncomingType}
              onFilterTypeChange={setFilterIncomingType}
              statusFilterOptions={statusFilterOptions}
              loading={loading}
              loadingMore={loadingMore}
              hasMore={hasMore}
              requests={filteredIncomingRequests}
              onCardClick={handleCardClick}
              renderCardHeader={renderCardHeader}
              onLoadMore={handleLoadMore}
              lastElementRef={lastElementRef}
            />
          )}

          {activeTab === "my-requests" && (
            <MobileTabPanel
              activeTab="my-requests"
              title={ADMIN_WORKER_TAB_TITLES["my-requests"]}
              filterStatus={filterMyStatus}
              onFilterStatusChange={setFilterMyStatus}
              filterType={filterMyType}
              onFilterTypeChange={setFilterMyType}
              statusFilterOptions={statusFilterOptions}
              loading={loading}
              loadingMore={loadingMore}
              hasMore={hasMore}
              requests={filteredMyRequests}
              onCardClick={handleCardClick}
              renderCardHeader={renderCardHeader}
              onLoadMore={handleLoadMore}
              lastElementRef={lastElementRef}
            />
          )}

          {activeTab === "recurring" && (
            <div className="space-y-4 admin-management-content pb-8">
              <h2 className="text-lg font-bold text-white">
                {ADMIN_WORKER_TAB_TITLES.recurring}
              </h2>
              <AdminWorkerRequestsRecurringTab
                isDesktop={false}
                onDeleteTask={handleDeleteRecurringTask}
              />
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
