"use client";

import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import { RequestDetails } from "@/components/requests";
import { RequestsExportButton, RequestsExportNotice } from "@/components/requests/requests-export";
import { RequestsTabs } from "@/components/requests/requests-tabs";
import { REQUEST_TYPE_FILTER_OPTIONS } from "@/constants/requests";
import type { UseManagerRequestsListResult } from "@/hooks/use-manager-requests-list";
import { useRequestExport } from "@/hooks/use-request-export";
import {
  requestExportFileName,
  requestExportMeta,
  requestExportParams,
  requestExportSummary,
  requestPeriodRange,
  type RequestExportConditions,
} from "@/lib/request-export";
import { useManagerRequestCardHeader } from "./manager-request-card-header";
import { ManagerRequestsFilters } from "./manager-requests-filters";
import { RequestsListContent } from "@/components/requests/requests-list-content";
import { ManagerDeletionAuditList } from "./manager-deletion-audit-list";
import { MANAGER_DESKTOP_REQUEST_TABS } from "./manager-requests-constants";
import dynamic from "next/dynamic";

const LogsViewer = dynamic(() => import("@/components/logs-viewer").then((mod) => ({ default: mod.LogsViewer })), { ssr: false });

type ManagerRequestsDesktopProps = UseManagerRequestsListResult;

const optionLabel = (options: readonly { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? null;

export function ManagerRequestsDesktop(props: ManagerRequestsDesktopProps) {
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
    matchedCount,
    handleCardClick,
    displayRequest,
    handleClosePanel,
    handleRequestUpdated,
    handleLoadMore,
  } = props;

  const renderCardHeader = useManagerRequestCardHeader();
  const requestExport = useRequestExport();

  const showRequestList = activeTab !== "deleted" && activeTab !== "logs";
  const isRejectedTab = activeTab === "rejected";

  const exportConditions: RequestExportConditions = {
    tab: isRejectedTab ? "rejected" : "all",
    office,
    officeName: offices.find((o) => String(o.id) === office)?.name ?? null,
    period,
    status: filterStatus,
    statusLabel: optionLabel(statusFilterOptions, filterStatus),
    type: filterType,
    typeLabel: optionLabel(REQUEST_TYPE_FILTER_OPTIONS, filterType),
  };

  const downloadExport = () => {
    const now = new Date();
    const range = requestPeriodRange(period, now);
    requestExport.download(
      requestExportParams(exportConditions, range),
      requestExportFileName(exportConditions, range, now),
    );
  };

  return (
    <AdminManagerRequestsDesktopFrame
      filtersSlot={
        showRequestList ? (
          <ManagerRequestsFilters
            variant="desktop"
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
            hideStatusFilter={isRejectedTab}
          />
        ) : null
      }
      isFiltered={showRequestList && props.isFiltered}
      onResetFilters={props.resetFilters}
      toolbarEndSlot={
        showRequestList ? (
          <RequestsExportButton
            count={matchedCount}
            loading={loading}
            summary={requestExportSummary(exportConditions, requestPeriodRange(period))}
            meta={requestExportMeta(matchedCount, exportConditions.tab)}
            preparing={requestExport.state.status === "preparing"}
            onDownload={downloadExport}
          />
        ) : null
      }
      noticeSlot={
        <RequestsExportNotice state={requestExport.state} onRetry={requestExport.retry} onDismiss={requestExport.dismiss} />
      }
      tabsSlot={
        <RequestsTabs variant="desktop" tabs={MANAGER_DESKTOP_REQUEST_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      }
      listSlot={
        showRequestList ? (
          <RequestsListContent
            userRole="manager"
            variant="desktop"
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
            bulkDelete={bulkDelete}
            emptyMessage={isRejectedTab ? "Отклонённых заявок нет" : undefined}
            emptyFilteredHint={
              isRejectedTab
                ? "Измените офис, период или тип — или сбросьте фильтры"
                : "Измените офис, период, статус или тип — или сбросьте фильтры"
            }
          />
        ) : activeTab === "logs" ? (
          <LogsViewer userRole="manager" isDesktop dark />
        ) : (
          <ManagerDeletionAuditList variant="desktop" />
        )
      }
      detailSlot={
        displayRequest && showRequestList ? (
          <RequestDetails
            request={displayRequest}
            onClose={handleClosePanel}
            onRequestUpdated={handleRequestUpdated}
            userRole="manager"
            sourceTab="myTasks"
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
