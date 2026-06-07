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
import type { AdminWorkerOffice } from "@/hooks/use-admin-worker-requests-list";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface AdminWorkerRequestsFiltersProps {
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterOffice: string;
  onFilterOfficeChange: (value: string) => void;
  offices: AdminWorkerOffice[];
  statusFilterOptions: FilterOption[];
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
  variant = "mobile",
}: AdminWorkerRequestsFiltersProps) {
  const isDesktop = variant === "desktop";
  const triggerClass = mobileRequestsFilterTrigger(variant);
  const contentClass = mobileRequestsFilterContent(variant);

  return (
    <div className={cn("space-y-2", isDesktop ? "flex flex-wrap gap-2 space-y-0" : undefined)}>
      <div className={cn("flex gap-2", isDesktop && "contents")}>
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
      </div>
      <div className={cn("flex gap-2", isDesktop && "contents")}>
        <Select value={filterOffice} onValueChange={onFilterOfficeChange}>
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Офис" />
          </SelectTrigger>
          <SelectContent className={contentClass}>
            <SelectItem value="all">
              Все офисы
            </SelectItem>
            {offices.map((office) => (
              <SelectItem key={office.id} value={String(office.id)}>
                {office.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
