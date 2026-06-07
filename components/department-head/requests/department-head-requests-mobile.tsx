"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { Button } from "@/components/ui/button";
import type { UseDepartmentHeadRequestsListResult } from "@/hooks/use-department-head-requests-list";
import { useDepartmentHeadRequestCardHeader } from "./department-head-request-card-header";
import {
  DEPARTMENT_HEAD_TAB_TITLES,
  type DepartmentHeadRequestsTab,
} from "./department-head-requests-constants";
import { DepartmentHeadRequestsFilters } from "./department-head-requests-filters";
import { DepartmentHeadRequestsListContent } from "./department-head-requests-list-content";
import { DepartmentHeadRequestsRecurringTab } from "./department-head-requests-recurring-tab";
import { DepartmentHeadRequestsTabs } from "./department-head-requests-tabs";

type DepartmentHeadRequestsMobileProps = UseDepartmentHeadRequestsListResult;

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
  activeTab: DepartmentHeadRequestsTab;
  title: string;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  statusFilterOptions: { value: string; label: string }[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  requests: UseDepartmentHeadRequestsListResult["activeList"];
  onCardClick: UseDepartmentHeadRequestsListResult["handleCardClick"];
  renderCardHeader: ReturnType<typeof useDepartmentHeadRequestCardHeader>;
  onLoadMore: () => void;
  lastElementRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="flex gap-2">
        <DepartmentHeadRequestsFilters
          variant="mobile"
          filterStatus={filterStatus}
          onFilterStatusChange={onFilterStatusChange}
          filterType={filterType}
          onFilterTypeChange={onFilterTypeChange}
          statusFilterOptions={statusFilterOptions}
        />
      </div>
      <div className="space-y-4 pb-40">
        <DepartmentHeadRequestsListContent
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

/** Mobile list — parity с workflow-mobile requests index (department-head). */
export function DepartmentHeadRequestsMobile(props: DepartmentHeadRequestsMobileProps) {
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

  const renderCardHeader = useDepartmentHeadRequestCardHeader();

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div
        className="min-h-screen px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="text-2xl font-bold text-foreground mb-4">Заявки</h1>

        <DepartmentHeadRequestsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-4 space-y-4">
          <Link href="/create-request" className="block">
            <Button className="w-full h-12 bg-[#E25B21] hover:bg-[#D94F15] text-white font-semibold rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              Создать
            </Button>
          </Link>

          {activeTab === "incoming" && (
            <MobileTabPanel
              activeTab="incoming"
              title={DEPARTMENT_HEAD_TAB_TITLES.incoming}
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
              title={DEPARTMENT_HEAD_TAB_TITLES["my-requests"]}
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
              <h2 className="text-lg font-bold text-foreground">
                {DEPARTMENT_HEAD_TAB_TITLES.recurring}
              </h2>
              <DepartmentHeadRequestsRecurringTab
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
