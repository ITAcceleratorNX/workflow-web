"use client";

import {
  RequestOfficeFilter,
  RequestStatusFilter,
  RequestTypeFilter,
  type RequestsFilterOption,
} from "@/components/requests/requests-filter-select";
import type { AdminWorkerOffice } from "@/hooks/use-admin-worker-requests-list";
import { cn } from "@/lib/utils";

interface AdminWorkerRequestsFiltersProps {
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterOffice: string;
  onFilterOfficeChange: (value: string) => void;
  offices: AdminWorkerOffice[];
  statusFilterOptions: RequestsFilterOption[];
  /** Вкладка «Отклонённые»: статус у всех заявок один — фильтр не нужен. */
  hideStatusFilter?: boolean;
  variant?: "mobile" | "desktop";
}

export function AdminWorkerRequestsFilters({
  filterStatus,
  onFilterStatusChange,
  filterType,
  onFilterTypeChange,
  filterOffice,
  onFilterOfficeChange,
  offices,
  statusFilterOptions,
  hideStatusFilter = false,
  variant = "mobile",
}: AdminWorkerRequestsFiltersProps) {
  const isDesktop = variant === "desktop";

  return (
    <div className={cn("space-y-2", isDesktop ? "flex flex-wrap gap-2 space-y-0" : undefined)}>
      <div className={cn("flex gap-2", isDesktop && "contents")}>
        {!hideStatusFilter && (
          <RequestStatusFilter
            value={filterStatus}
            onChange={onFilterStatusChange}
            options={statusFilterOptions}
            variant={variant}
          />
        )}
        <RequestTypeFilter value={filterType} onChange={onFilterTypeChange} variant={variant} />
      </div>
      <div className={cn("flex gap-2", isDesktop && "contents")}>
        <RequestOfficeFilter value={filterOffice} onChange={onFilterOfficeChange} offices={offices} variant={variant} />
      </div>
    </div>
  );
}
