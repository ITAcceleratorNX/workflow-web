"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REQUEST_TYPE_FILTER_OPTIONS } from "@/constants/requests";
import { cn } from "@/lib/utils";

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
  const isDesktop = variant === "desktop";
  const triggerClass = isDesktop
    ? "w-[140px] bg-[#2C2C2E] border-white/10 text-white"
    : "flex-1 bg-[#2C2C2E] border-[#3A3A3C] text-white";
  const contentClass = isDesktop
    ? "bg-[#2C2C2E] border-white/10"
    : "bg-[#2C2C2E] border-[#3A3A3C]";

  return (
    <>
      <Select value={filterStatus} onValueChange={onFilterStatusChange}>
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="Статус" />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          {statusFilterOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={cn(!isDesktop && "text-white")}
            >
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
            <SelectItem
              key={option.value}
              value={option.value}
              className={cn(!isDesktop && "text-white")}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
