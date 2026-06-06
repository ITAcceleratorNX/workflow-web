"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { Button } from "@/components/ui/button";
import { ExecutorMobileCardHeader } from "@/components/executor-mobile/ExecutorMobileCardHeader";
import {
  MOBILE_BOTTOM_NAV_PADDING,
  MOBILE_PAGE_GRADIENTS,
} from "@/constants/mobile-layout";
import type { RequestGroup } from "@/stores/useRequestStore";
import type { UseExecutorRequestsListResult } from "@/hooks/use-executor-requests-list";
import { EXECUTOR_REQUEST_TABS } from "./executor-requests-constants";
import { ExecutorRequestsFilters } from "./executor-requests-filters";
import { ExecutorRequestsListContent } from "./executor-requests-list-content";
import { ExecutorRequestsTabs } from "./executor-requests-tabs";

type ExecutorRequestsMobileProps = UseExecutorRequestsListResult;

/** Mobile list — parity с workflow-mobile requests index (executor). */
export function ExecutorRequestsMobile(props: ExecutorRequestsMobileProps) {
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
    handleRefresh,
    handleCardClick,
  } = props;

  const renderCardHeader = (requestGroup: RequestGroup) => (
    <ExecutorMobileCardHeader requestGroup={requestGroup} />
  );

  const activeTabLabel =
    EXECUTOR_REQUEST_TABS.find((tab) => tab.key === activeTab)?.label ?? "Заявки";

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div
        className="min-h-screen px-4 pt-[max(1rem,env(safe-area-inset-top))]"
        style={{
          background: MOBILE_PAGE_GRADIENTS.executor,
          paddingBottom: MOBILE_BOTTOM_NAV_PADDING,
        }}
      >
        <h1 className="text-2xl font-bold text-white mb-4">Заявки</h1>

        <ExecutorRequestsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-4 space-y-4">
          <h2 className="text-lg font-bold text-white">{activeTabLabel}</h2>

          <div className="flex gap-2">
            <ExecutorRequestsFilters
              variant="mobile"
              activeTab={activeTab}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              filterMyStatus={filterMyStatus}
              onFilterMyStatusChange={setFilterMyStatus}
              filterMyType={filterMyType}
              onFilterMyTypeChange={setFilterMyType}
              statusFilterOptions={statusFilterOptions}
            />
          </div>

          <Link href="/create-request" className="block">
            <Button className="w-full h-12 bg-[#E25B21] hover:bg-[#D94F15] text-white font-semibold rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              Создать
            </Button>
          </Link>

          <div className="space-y-4 pb-8">
            <ExecutorRequestsListContent
              variant="mobile"
              loading={loading}
              requests={activeList}
              activeTab={activeTab}
              clientRatings={clientRatings}
              onCardClick={handleCardClick}
              renderCardHeader={renderCardHeader}
            />
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
