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

interface FilterOption {
  value: string;
  label: string;
}

interface ClientRequestsFiltersProps {
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  statusFilterOptions: FilterOption[];
  variant?: "mobile" | "desktop";
}

export function ClientRequestsFilters({
  filterStatus,
  onFilterStatusChange,
  filterType,
  onFilterTypeChange,
  statusFilterOptions,
  variant = "mobile",
}: ClientRequestsFiltersProps) {
  const isDesktop = variant === "desktop";
  const itemClass = mobileRequestsFilterItem(variant);

  return (
    <>
      <Select value={filterStatus} onValueChange={onFilterStatusChange}>
        <SelectTrigger className={mobileRequestsFilterTrigger(variant)}>
          <SelectValue placeholder="Статус" />
        </SelectTrigger>
        <SelectContent className={mobileRequestsFilterContent(variant)}>
          {statusFilterOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={itemClass ?? "text-white"}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterType} onValueChange={onFilterTypeChange}>
        <SelectTrigger className={mobileRequestsFilterTrigger(variant)}>
          <SelectValue placeholder={isDesktop ? "Тип заявки" : "Тип"} />
        </SelectTrigger>
        <SelectContent className={mobileRequestsFilterContent(variant)}>
          {REQUEST_TYPE_FILTER_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={itemClass ?? "text-white"}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
