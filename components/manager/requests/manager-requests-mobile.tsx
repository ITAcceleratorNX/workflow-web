"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import { MOBILE_REQUESTS_PAGE_CLASS } from "@/constants/mobile-requests-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UseManagerRequestsListResult } from "@/hooks/use-manager-requests-list";
import { useManagerRequestCardHeader } from "./manager-request-card-header";
import { ManagerRequestsFilters } from "./manager-requests-filters";
import { ManagerRequestsListContent } from "./manager-requests-list-content";

type ManagerRequestsMobileProps = UseManagerRequestsListResult;

/** Mobile list — parity с workflow-mobile requests index (manager). */
export function ManagerRequestsMobile(props: ManagerRequestsMobileProps) {
  const {
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
          className={cn(MOBILE_REQUESTS_PAGE_CLASS, "px-4 pt-[max(1rem,env(safe-area-inset-top))]")}>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-foreground">Заявки</h1>
            <Link href="/create-request">
              <Button className="h-12 px-5 bg-[#F35713] hover:bg-[#E04A0A] text-white font-semibold rounded-2xl">
                <Plus className="h-4 w-4 mr-2" />
                Создать
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
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
              />
            </div>

            <div className="space-y-4 pb-40">
              <ManagerRequestsListContent
                variant="mobile"
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                requests={filteredRequests}
                onCardClick={handleCardClick}
                renderCardHeader={renderCardHeader}
                onLoadMore={handleLoadMore}
                lastElementRef={lastElementRef}
              />
            </div>
          </div>
        </div>
      </PullToRefresh>
    </>
  );
}
