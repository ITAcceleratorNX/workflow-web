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

interface FilterOption {
  value: string;
  label: string;
}

interface DepartmentHeadRequestsFiltersProps {
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  statusFilterOptions: FilterOption[];
  variant?: "mobile" | "desktop";
}

export function DepartmentHeadRequestsFilters({
  filterStatus,
  onFilterStatusChange,
  filterType,
  onFilterTypeChange,
  statusFilterOptions,
  variant = "mobile",
}: DepartmentHeadRequestsFiltersProps) {
  const triggerClass = mobileRequestsFilterTrigger(variant);
  const contentClass = mobileRequestsFilterContent(variant);

  return (
    <>
      <Select value={filterStatus} onValueChange={onFilterStatusChange}>
        <SelectTrigger className={triggerClass}>
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
        <SelectTrigger className={triggerClass}>
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
