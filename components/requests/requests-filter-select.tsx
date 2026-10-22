"use client";

import type { ReactNode } from "react";
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

export interface RequestsFilterOption {
  value: string;
  label: string;
}

type Variant = "mobile" | "desktop";

interface RequestsFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly RequestsFilterOption[];
  variant: Variant;
  /** «Статус», «Тип» — подпись перед выбранным значением; без неё — только значение. */
  label?: ReactNode;
  placeholder?: string;
  /** Ширина/растяжение триггера (по умолчанию — как у остальных фильтров списка заявок). */
  triggerClassName?: string;
  /** Пункт меню на mobile, если тема страницы его не задаёт. */
  mobileItemClassName?: string;
}

/** Один фильтр списка заявок — общий для всех ролей, desktop и mobile. */
export function RequestsFilterSelect({
  value,
  onChange,
  options,
  variant,
  label,
  placeholder = "Все",
  triggerClassName,
  mobileItemClassName,
}: RequestsFilterSelectProps) {
  const itemClass = mobileRequestsFilterItem(variant) ?? mobileItemClassName;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={triggerClassName ?? mobileRequestsFilterTrigger(variant)}
        aria-label={typeof label === "string" ? label : placeholder}
      >
        {/* На телефоне — только значение, как в макете; подпись остаётся для экранных читалок. */}
        {label && variant === "desktop" ? (
          <span className="min-w-0 truncate">
            {label}: <SelectValue placeholder={placeholder} />
          </span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent className={mobileRequestsFilterContent(variant)}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className={itemClass}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type StatusTypeProps = Pick<RequestsFilterSelectProps, "variant" | "triggerClassName" | "mobileItemClassName">;

export function RequestStatusFilter({
  value,
  onChange,
  options,
  ...rest
}: StatusTypeProps & { value: string; onChange: (value: string) => void; options: readonly RequestsFilterOption[] }) {
  return <RequestsFilterSelect label="Статус" value={value} onChange={onChange} options={options} {...rest} />;
}

export function RequestTypeFilter({
  value,
  onChange,
  ...rest
}: StatusTypeProps & { value: string; onChange: (value: string) => void }) {
  return (
    <RequestsFilterSelect label="Тип" value={value} onChange={onChange} options={REQUEST_TYPE_FILTER_OPTIONS} {...rest} />
  );
}

/** Офис: «Все офисы» + офисы роли. */
export function RequestOfficeFilter({
  value,
  onChange,
  offices,
  ...rest
}: StatusTypeProps & {
  value: string;
  onChange: (value: string) => void;
  offices: readonly { id: number; name: string }[];
}) {
  return (
    <RequestsFilterSelect
      value={value}
      onChange={onChange}
      placeholder="Офис"
      options={[{ value: "all", label: "Все офисы" }, ...offices.map((o) => ({ value: String(o.id), label: o.name }))]}
      {...rest}
    />
  );
}

interface RequestStatusTypeFiltersProps {
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  statusFilterOptions: readonly RequestsFilterOption[];
  variant?: Variant;
  mobileItemClassName?: string;
}

/** Статус + тип — фильтры списка заявок Офис-менеджера и Клиента. */
export function RequestStatusTypeFilters({
  filterStatus,
  onFilterStatusChange,
  filterType,
  onFilterTypeChange,
  statusFilterOptions,
  variant = "mobile",
  mobileItemClassName,
}: RequestStatusTypeFiltersProps) {
  return (
    <>
      <RequestStatusFilter
        value={filterStatus}
        onChange={onFilterStatusChange}
        options={statusFilterOptions}
        variant={variant}
        mobileItemClassName={mobileItemClassName}
      />
      <RequestTypeFilter
        value={filterType}
        onChange={onFilterTypeChange}
        variant={variant}
        mobileItemClassName={mobileItemClassName}
      />
    </>
  );
}
