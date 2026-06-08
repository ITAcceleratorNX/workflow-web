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
  mobileRequestsFilterItem,
  mobileRequestsFilterTrigger,
} from "@/constants/mobile-requests-ui";
import { REQUEST_TYPE_FILTER_OPTIONS } from "@/constants/requests";
import type { ExecutorRequestsTab } from "./executor-requests-constants";

interface FilterOption {
  value: string;
  label: string;
}

interface ExecutorRequestsFiltersProps {
  activeTab: ExecutorRequestsTab;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterMyStatus: string;
  onFilterMyStatusChange: (value: string) => void;
  filterMyType: string;
  onFilterMyTypeChange: (value: string) => void;
  statusFilterOptions: FilterOption[];
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
  const triggerClass = mobileRequestsFilterTrigger(variant);
  const contentClass = mobileRequestsFilterContent(variant);
  const itemClass = mobileRequestsFilterItem(variant);

  if (activeTab === "myTasks") {
    return (
      <>
        <Select value={filterMyStatus} onValueChange={onFilterMyStatusChange}>
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent className={contentClass}>
            {statusFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className={itemClass}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterMyType} onValueChange={onFilterMyTypeChange}>
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent className={contentClass}>
            {REQUEST_TYPE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className={itemClass}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </>
    );
  }

  return (
    <Select value={filterType} onValueChange={onFilterTypeChange}>
      <SelectTrigger className={triggerClass}>
        <SelectValue placeholder="Тип" />
      </SelectTrigger>
      <SelectContent className={contentClass}>
        {REQUEST_TYPE_FILTER_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className={itemClass}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
