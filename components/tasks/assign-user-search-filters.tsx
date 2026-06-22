"use client";

import { Info } from "lucide-react";

import type { useAssignUserSearchScope } from "@/hooks/use-assign-user-search-scope";
import { cn } from "@/lib/utils";

type ScopeState = ReturnType<typeof useAssignUserSearchScope>;

type Props = {
  filters: ScopeState;
  className?: string;
  variant?: "sheet" | "dialog";
};

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors",
        active
          ? "border-[#F35713] bg-[rgba(243,87,19,0.2)] text-[#F35713]"
          : "border-border text-foreground",
      )}
    >
      {label}
    </button>
  );
}

export function AssignUserSearchFilters({
  filters,
  className,
  variant = "sheet",
}: Props) {
  const {
    canToggleScope,
    scope,
    setScope,
    showCompanyPills,
    showOfficePills,
    showAdminCompanyPills,
    offices,
    companies,
    officeFilterId,
    companyFilterId,
    selectOfficeFilter,
    selectCompanyFilter,
  } = filters;

  const hasFilters =
    canToggleScope || showCompanyPills || showOfficePills || showAdminCompanyPills;

  if (!hasFilters) return null;

  const pad = variant === "dialog" ? "px-2" : "px-0";

  return (
    <div className={cn("space-y-2 mb-2", pad, className)}>
      {canToggleScope ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScope("company")}
            className={cn(
              "flex-1 rounded-[10px] border px-2 py-2.5 text-[13px] font-semibold text-center transition-colors",
              scope === "company"
                ? "border-[#F35713] bg-[rgba(243,87,19,0.2)] text-[#F35713]"
                : "border-border text-foreground",
            )}
          >
            Моя компания
          </button>
          <button
            type="button"
            onClick={() => setScope("office")}
            className={cn(
              "flex-1 rounded-[10px] border px-2 py-2.5 text-[13px] font-semibold text-center transition-colors",
              scope === "office"
                ? "border-[#F35713] bg-[rgba(243,87,19,0.2)] text-[#F35713]"
                : "border-border text-foreground",
            )}
          >
            Весь офис
          </button>
        </div>
      ) : null}

      {showOfficePills ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterPill
            active={officeFilterId === null}
            label="Все офисы"
            onClick={() => selectOfficeFilter(null)}
          />
          {offices.map((o) => {
            const active = officeFilterId === o.id;
            return (
              <FilterPill
                key={o.id}
                active={active}
                label={o.name}
                onClick={() => selectOfficeFilter(active ? null : o.id)}
              />
            );
          })}
        </div>
      ) : null}

      {showCompanyPills || showAdminCompanyPills ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterPill
            active={companyFilterId === null}
            label="Все компании"
            onClick={() => selectCompanyFilter(null)}
          />
          {companies.map((c) => {
            const active = companyFilterId === c.id;
            return (
              <FilterPill
                key={c.id}
                active={active}
                label={c.name}
                onClick={() => selectCompanyFilter(active ? null : c.id)}
              />
            );
          })}
        </div>
      ) : null}

      {showOfficePills && officeFilterId == null ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground px-0.5">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Выберите офис, чтобы сузить поиск по компании
        </p>
      ) : null}
    </div>
  );
}
