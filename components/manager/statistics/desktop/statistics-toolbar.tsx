"use client";

import { useState } from "react";
import { CalendarDays, Check, ChevronDown, ChevronUp, Download, FileSpreadsheet, FileBarChart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseDateKey, type ManagerStatsPeriod } from "@/lib/manager-period";
import { cn } from "@/lib/utils";
import type { UseManagerStatisticsPageResult } from "@/hooks/use-manager-statistics-page";

const PERIODS: { value: Exclude<ManagerStatsPeriod, "custom">; label: string }[] = [
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "year", label: "Год" },
];

const MENU_CLASS = "rounded-xl border border-white/10 bg-[#2c2c2e] p-1.5 text-white shadow-xl";

function OfficeFilter({ office, setOffice, offices, officeName }: Pick<UseManagerStatisticsPageResult, "office" | "setOffice" | "offices" | "officeName">) {
  const [open, setOpen] = useState(false);
  const active = office !== "all";
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "flex h-10 max-w-[240px] items-center gap-1.5 rounded-[10px] border px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E85D2B]",
          active ? "border-[#e85d2b]/70 bg-[#3a1c10]" : "border-white/10 bg-[#2c2c2e] hover:bg-[#333336]",
        )}
      >
        <span className="text-white/50">Офис:</span>
        <span className={cn("truncate", active ? "font-semibold text-[#ff8a5c]" : "font-medium text-white")}>{officeName}</span>
        <ChevronDown className={cn("ml-1 h-4 w-4 shrink-0 text-white transition-transform", open && "rotate-180")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn(MENU_CLASS, "max-h-80 min-w-[220px] overflow-y-auto")}>
        {[{ id: "all", name: "Все офисы" }, ...offices.map((o) => ({ id: String(o.id), name: o.name }))].map((item) => (
          <DropdownMenuItem
            key={item.id}
            onSelect={() => setOffice(item.id)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-white focus:bg-white/10 focus:text-white"
          >
            {item.name}
            {office === item.id && <Check className="h-4 w-4 text-[#E85D2B]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-white/60">{label}</span>
      <span className="flex h-10 items-center gap-2.5 rounded-[10px] border border-white/10 bg-[#1f1f21] px-3 focus-within:border-[#E85D2B]">
        <CalendarDays className="h-4 w-4 shrink-0 text-white/70" />
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden"
        />
      </span>
    </label>
  );
}

function PeriodFilter({ period, selectPeriod, applyCustomRange, range }: Pick<UseManagerStatisticsPageResult, "period" | "selectPeriod" | "applyCustomRange" | "range">) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(range.fromKey);
  const [to, setTo] = useState(range.toKey);
  const custom = period === "custom";
  const valid = Boolean(from && to);

  const segment = (active: boolean) =>
    cn(
      "h-[29px] rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
      active ? "bg-[#E85D2B] text-white" : "text-white/70 hover:text-white",
    );

  return (
    <div className="flex h-10 items-center gap-0.5 rounded-[10px] border border-white/10 bg-[#2c2c2e] p-[5px]">
      {PERIODS.map((p) => (
        <button key={p.value} type="button" className={segment(period === p.value)} onClick={() => selectPeriod(p.value)}>
          {p.label}
        </button>
      ))}
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setFrom(range.fromKey);
            setTo(range.toKey);
          }
          setOpen(next);
        }}
      >
        <PopoverTrigger
          aria-label="Свои даты"
          className={cn(segment(custom), "flex items-center gap-1.5", !custom && "px-2.5")}
        >
          <CalendarDays className="h-4 w-4" />
          {custom && "Свои даты"}
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={10} className="w-[300px] rounded-xl border border-white/10 bg-[#2c2c2e] p-4 text-white shadow-xl">
          <p className="mb-4 text-sm font-semibold">Свои даты</p>
          <div className="space-y-4">
            <DateField label="С" value={from} onChange={setFrom} />
            <DateField label="По" value={to} onChange={setTo} />
          </div>
          <button
            type="button"
            disabled={!valid}
            onClick={() => {
              applyCustomRange(parseDateKey(from), parseDateKey(to));
              setOpen(false);
            }}
            className="mt-3 h-10 w-full rounded-[10px] bg-[#E85D2B] text-sm font-medium text-white transition-colors hover:bg-[#d4511f] disabled:opacity-50"
          >
            Применить
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ExportMenu({ handleExport, exporting, officeName, rangeLabel }: Pick<UseManagerStatisticsPageResult, "handleExport" | "exporting" | "officeName" | "rangeLabel">) {
  const [open, setOpen] = useState(false);
  const items = [
    { format: "xlsx" as const, icon: FileSpreadsheet, title: "Excel", text: "Таблица с заявками, .xlsx" },
    { format: "pbix" as const, icon: FileBarChart, title: "Шаблон Power BI", text: "Файл шаблона отчёта, .pbit" },
  ];
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        disabled={exporting}
        className={cn(
          "flex h-10 items-center gap-2 rounded-[10px] border px-4 text-sm font-medium text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E85D2B] disabled:opacity-60",
          open ? "border-[#e85d2b]/70 bg-[#3a1c10]" : "border-white/20 bg-[#2c2c2e] hover:bg-[#333336]",
        )}
      >
        <Download className="h-4 w-4" />
        {exporting ? "Подготовка…" : "Экспорт"}
        {open ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className={cn(MENU_CLASS, "w-[300px]")}>
        <div className="border-b border-white/10 px-2.5 pb-2.5 pt-1.5">
          <p className="text-xs text-white/50">Выгрузить за период</p>
          <p className="mt-0.5 text-[13px] font-semibold text-white">{officeName} · {rangeLabel}</p>
        </div>
        <div className="pt-1.5">
          {items.map((item) => (
            <DropdownMenuItem
              key={item.format}
              onSelect={() => void handleExport(item.format)}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 focus:bg-white/[0.08] focus:text-white"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E85D2B]/20">
                <item.icon className="h-4 w-4 text-[#E85D2B]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white">{item.title}</span>
                <span className="block text-xs text-white/50">{item.text}</span>
              </span>
              <Download className="h-4 w-4 shrink-0 text-white/60" />
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StatisticsToolbar(state: UseManagerStatisticsPageResult) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <OfficeFilter {...state} />
      <PeriodFilter {...state} />
      {state.canExport && <ExportMenu {...state} />}
    </div>
  );
}

