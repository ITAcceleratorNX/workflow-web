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

  return (
    <>
      <Select value={filterStatus} onValueChange={onFilterStatusChange}>
        <SelectTrigger
          className={cn(
            "w-[140px]",
            isDesktop
              ? "bg-[#2C2C2E] border-white/10 text-white"
              : "flex-1 bg-[#2C2C2E] border-gray-700 text-white"
          )}
        >
          <SelectValue placeholder="Статус" />
        </SelectTrigger>
        <SelectContent
          className={cn(
            isDesktop ? "bg-[#2C2C2E] border-white/10" : "bg-[#2C2C2E] border-gray-700"
          )}
        >
          {statusFilterOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={!isDesktop ? "text-white" : undefined}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterType} onValueChange={onFilterTypeChange}>
        <SelectTrigger
          className={cn(
            "w-[140px]",
            isDesktop
              ? "bg-[#2C2C2E] border-white/10 text-white"
              : "flex-1 bg-[#2C2C2E] border-gray-700 text-white"
          )}
        >
          <SelectValue placeholder={isDesktop ? "Тип заявки" : "Тип"} />
        </SelectTrigger>
        <SelectContent
          className={cn(
            isDesktop ? "bg-[#2C2C2E] border-white/10" : "bg-[#2C2C2E] border-gray-700"
          )}
        >
          {REQUEST_TYPE_FILTER_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={!isDesktop ? "text-white" : undefined}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
