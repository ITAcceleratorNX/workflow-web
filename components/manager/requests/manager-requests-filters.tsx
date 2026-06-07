"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mobileRequestsFilterContent,
  mobileRequestsFilterTrigger,
} from "@/constants/mobile-requests-ui";
import { REQUEST_TYPE_FILTER_OPTIONS } from "@/constants/requests";
import {
  MANAGER_PERIOD_OPTIONS,
  type ManagerOffice,
  type ManagerRequestPeriod,
} from "./manager-requests-constants";

interface FilterOption {
  value: string;
  label: string;
}

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
  statusFilterOptions: FilterOption[];
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
  variant = "mobile",
}: ManagerRequestsFiltersProps) {
  const officeTriggerClass = mobileRequestsFilterTrigger(variant, "min-w-[120px]");
  const periodTriggerClass = mobileRequestsFilterTrigger(
    variant,
    variant === "desktop" ? "w-[120px]" : "min-w-[120px]",
  );
  const filterTriggerClass = mobileRequestsFilterTrigger(variant, "min-w-[120px]");
  const contentClass = mobileRequestsFilterContent(variant);

  return (
    <>
      <Select value={office} onValueChange={onOfficeChange}>
        <SelectTrigger className={officeTriggerClass}>
          <SelectValue placeholder="Офис" />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          <SelectItem value="all">
            Все офисы
          </SelectItem>
          {offices.map((o) => (
            <SelectItem key={o.id} value={String(o.id)}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={period} onValueChange={(v) => onPeriodChange(v as ManagerRequestPeriod)}>
        <SelectTrigger className={periodTriggerClass}>
          <SelectValue placeholder="Период" />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          {MANAGER_PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterStatus} onValueChange={onFilterStatusChange}>
        <SelectTrigger className={filterTriggerClass}>
          <SelectValue placeholder="Статус" />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          {statusFilterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterType} onValueChange={onFilterTypeChange}>
        <SelectTrigger className={filterTriggerClass}>
          <SelectValue placeholder="Тип" />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          {REQUEST_TYPE_FILTER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
