"use client";

import {
  RequestOfficeFilter,
  RequestStatusFilter,
  RequestsFilterSelect,
  RequestTypeFilter,
  type RequestsFilterOption,
} from "@/components/requests/requests-filter-select";
import { mobileRequestsFilterTrigger } from "@/constants/mobile-requests-ui";
import {
  MANAGER_PERIOD_OPTIONS,
  type ManagerOffice,
  type ManagerRequestPeriod,
} from "./manager-requests-constants";

interface ManagerRequestsFiltersProps {
  office: string;
  onOfficeChange: (value: string) => void;
  period: ManagerRequestPeriod;
  onPeriodChange: (value: ManagerRequestPeriod) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  offices: ManagerOffice[];
  statusFilterOptions: RequestsFilterOption[];
  /** Вкладка «Отклонённые»: статус у всех заявок один — фильтр не нужен. */
  hideStatusFilter?: boolean;
  variant?: "mobile" | "desktop";
}

export function ManagerRequestsFilters({
  office,
  onOfficeChange,
  period,
  onPeriodChange,
  filterStatus,
  onFilterStatusChange,
  filterType,
  onFilterTypeChange,
  offices,
  statusFilterOptions,
  hideStatusFilter = false,
  variant = "mobile",
}: ManagerRequestsFiltersProps) {
  const filterTriggerClass = mobileRequestsFilterTrigger(variant, "min-w-[120px]");
  const periodTriggerClass = mobileRequestsFilterTrigger(
    variant,
    variant === "desktop" ? "w-[120px]" : "min-w-[120px]",
  );

  return (
    <>
      <RequestOfficeFilter
        value={office}
        onChange={onOfficeChange}
        offices={offices}
        variant={variant}
        triggerClassName={filterTriggerClass}
      />
      <RequestsFilterSelect
        value={period}
        onChange={(v) => onPeriodChange(v as ManagerRequestPeriod)}
        options={MANAGER_PERIOD_OPTIONS}
        placeholder="Период"
        variant={variant}
        triggerClassName={periodTriggerClass}
      />
      {!hideStatusFilter && (
        <RequestStatusFilter
          value={filterStatus}
          onChange={onFilterStatusChange}
          options={statusFilterOptions}
          variant={variant}
          triggerClassName={filterTriggerClass}
        />
      )}
      <RequestTypeFilter
        value={filterType}
        onChange={onFilterTypeChange}
        variant={variant}
        triggerClassName={filterTriggerClass}
      />
    </>
  );
}
