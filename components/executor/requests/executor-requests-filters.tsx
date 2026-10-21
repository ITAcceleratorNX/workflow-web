"use client";

import {
  RequestStatusTypeFilters,
  RequestTypeFilter,
  type RequestsFilterOption,
} from "@/components/requests/requests-filter-select";
import type { ExecutorRequestsTab } from "./executor-requests-constants";

interface ExecutorRequestsFiltersProps {
  activeTab: ExecutorRequestsTab;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterMyStatus: string;
  onFilterMyStatusChange: (value: string) => void;
  filterMyType: string;
  onFilterMyTypeChange: (value: string) => void;
  statusFilterOptions: RequestsFilterOption[];
  variant?: "mobile" | "desktop";
}

export function ExecutorRequestsFilters({
  activeTab,
  filterType,
  onFilterTypeChange,
  filterMyStatus,
  onFilterMyStatusChange,
  filterMyType,
  onFilterMyTypeChange,
  statusFilterOptions,
  variant = "mobile",
}: ExecutorRequestsFiltersProps) {
  if (activeTab === "myTasks") {
    return (
      <RequestStatusTypeFilters
        filterStatus={filterMyStatus}
        onFilterStatusChange={onFilterMyStatusChange}
        filterType={filterMyType}
        onFilterTypeChange={onFilterMyTypeChange}
        statusFilterOptions={statusFilterOptions}
        variant={variant}
      />
    );
  }

  return <RequestTypeFilter value={filterType} onChange={onFilterTypeChange} variant={variant} />;
}
