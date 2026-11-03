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
  MOBILE_REQUESTS_FILTER_CONTENT,
  mobileRequestsFilterTrigger,
} from "@/constants/mobile-requests-ui";
import {
  RQ_DESKTOP_FILTER_LABEL,
  RQ_DESKTOP_FILTER_TRIGGER,
  RQ_DESKTOP_FILTER_VALUE,
  RQ_DESKTOP_MENU,
  RQ_DESKTOP_MENU_ITEM,
} from "@/constants/requests-desktop-ui";
import { REQUEST_TYPE_FILTER_OPTIONS } from "@/constants/requests";
import { cn } from "@/lib/utils";

export interface RequestsFilterOption {
  value: string;
  label: string;
}

type Variant = "mobile" | "desktop";

/** Значение «без фильтра» у всех фильтров списка заявок. */
const NO_FILTER = "all";

interface RequestsFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly RequestsFilterOption[];
  variant: Variant;
  /** «Офис», «Статус» — подпись перед выбранным значением на десктопе; на телефоне — только значение. */
  label?: ReactNode;
  placeholder?: string;
  /** Ширина/растяжение триггера на телефоне; на десктопе — дополнительные классы. */
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
  const isDesktop = variant === "desktop";
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        data-active={isDesktop && value !== NO_FILTER ? "true" : undefined}
        className={isDesktop ? cn(RQ_DESKTOP_FILTER_TRIGGER, triggerClassName) : triggerClassName ?? mobileRequestsFilterTrigger()}
        aria-label={typeof label === "string" ? label : placeholder}
      >
        {/* На телефоне — только значение, как в макете; подпись остаётся для экранных читалок. */}
        {label && isDesktop ? (
          <span className="min-w-0 truncate">
            <span className={RQ_DESKTOP_FILTER_LABEL}>{label}:</span>{" "}
            <span className={RQ_DESKTOP_FILTER_VALUE}>
              <SelectValue placeholder={placeholder} />
            </span>
          </span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent align={isDesktop ? "start" : undefined} className={isDesktop ? RQ_DESKTOP_MENU : MOBILE_REQUESTS_FILTER_CONTENT}>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={isDesktop ? RQ_DESKTOP_MENU_ITEM : mobileItemClassName}
          >
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
      label="Офис"
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
