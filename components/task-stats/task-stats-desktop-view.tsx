"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays, ChevronDown, Inbox, Search, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import type { StatsTab, UseTaskStatsPageResult } from "@/hooks/use-task-stats-page";
import {
  asOfLabel,
  departmentKey,
  emptyTitle,
  numericDate,
  periodPhrase,
  periodTitle,
  rangeLabel,
  shortRangeLabel,
  share,
  statsContent,
  type StatsPeriod,
  type StatsPeriodKind,
  type TaskStats,
} from "@/lib/task-stats";
import { cn } from "@/lib/utils";
import {
  Avatar,
  DailyChart,
  employeesLabel,
  endedNote,
  InfoLine,
  Meter,
  PeriodStepper,
  PriorityBars,
  smallSampleNote,
  SolidTabs,
  StatsError,
  StatsLoading,
  TeamAvatar,
  TeamMembers,
} from "./task-stats-parts";
import { TaskStatsRangePicker } from "./task-stats-range-picker";

const PERIOD_TABS = [
  { value: "week" as const, label: "Неделя" },
  { value: "month" as const, label: "Месяц" },
  { value: "custom" as const, label: "Свои даты" },
];
const VIEW_TABS = [
  { value: "my" as const, label: "Моя статистика" },
  { value: "employees" as const, label: "Сотрудники" },
];

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-ui-fg/[0.08] bg-ui-popover", className)}>{children}</section>;
}

/** Desktop «Статистика задач» (Figma «Моя статистика», «D2 · Руководитель: сотрудник», «Свои даты» and the states). */
export function TaskStatsDesktopView(page: UseTaskStatsPageResult) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { tab, period, employee } = page;
  const employeesMode = tab === "employees";
  const who = page.team ? page.teamDepartment?.department_name ?? "Вся команда" : employee?.full_name ?? "Мои задачи";

  const filters = (
    <div className="flex flex-wrap items-center gap-3">
      <SolidTabs<StatsPeriodKind>
        ariaLabel="Период"
        value={period.kind}
        options={PERIOD_TABS}
        onSelect={(kind) => (kind === "custom" ? setPickerOpen(true) : page.setPeriodKind(kind))}
      />
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverAnchor asChild>
          {period.kind === "custom" ? (
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen(true)}
              className="flex h-[43px] items-center gap-2.5 rounded-xl border border-ui-fg/10 bg-ui-surface px-3.5 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
            >
              <CalendarDays className="size-[18px] text-ui-accent" aria-hidden />
              {numericDate(period.from)} – {numericDate(period.to)}
              <ChevronDown className="size-4 text-ui-fg/60" aria-hidden />
            </button>
          ) : (
            <div>
              <PeriodStepper
                title={periodTitle(period)}
                canStep
                onStep={page.stepPeriod}
                className="h-[43px] min-w-[190px] border border-ui-fg/10"
                titleClassName="text-[15px]"
              />
            </div>
          )}
        </PopoverAnchor>
        <PopoverContent align="start" sideOffset={8} className="w-[380px] rounded-2xl border-ui-fg/[0.12] bg-ui-popover p-4 text-ui-fg">
          <TaskStatsRangePicker
            variant="popover"
            initial={period}
            todayKey={page.todayKey}
            onCancel={() => setPickerOpen(false)}
            onApply={(next) => {
              page.setPeriod(next);
              setPickerOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <p className="ml-auto truncate text-sm text-ui-fg/55">
        {who} · {rangeLabel(period)} · {asOfLabel(period, page.todayKey)}
      </p>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-8 py-[26px] text-ui-fg">
      <header className="flex min-h-11 items-center gap-4">
        <h1 className="flex-1 text-[28px] font-bold leading-[33px]">Статистика задач</h1>
        {page.canViewEmployees ? (
          <SolidTabs<StatsTab> ariaLabel="Чья статистика" value={tab} options={VIEW_TABS} onSelect={page.setTab} size="lg" className="[&_button]:text-[15px]" />
        ) : null}
      </header>

      {employeesMode ? (
        <div className="grid grid-cols-[280px_minmax(0,1fr)] items-start gap-4">
          <EmployeePanel page={page} />
          <div className="flex min-w-0 flex-col gap-4">
            {filters}
            {page.team ? (
              <>
                <div className="flex items-center gap-3">
                  <TeamAvatar className="size-11" />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{page.teamDepartment?.department_name ?? "Вся команда"}</p>
                    <p className="truncate text-sm text-ui-fg/55">{teamCaption(page)}</p>
                  </div>
                </div>
                <StatsBody page={page} />
                <TeamPanel page={page} />
              </>
            ) : employee ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar name={employee.full_name} className="size-11 text-base" />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{employee.full_name}</p>
                    {employee.position ? <p className="truncate text-sm text-ui-fg/55">{employee.position}</p> : null}
                  </div>
                </div>
                <StatsBody page={page} />
              </>
            ) : (
              <Panel className="flex min-h-[420px] items-center justify-center">
                <EmptyState icon={<Users />} title="Выберите сотрудника" description="Статистика откроется здесь" />
              </Panel>
            )}
          </div>
        </div>
      ) : (
        <>
          {filters}
          <StatsBody page={page} />
        </>
      )}
    </div>
  );
}

/** «Отдел продаж · 7 сотрудников», «Показатели отдела · 2 сотрудника», or the count across several departments. */
function teamCaption(page: UseTaskStatsPageResult): string {
  if (page.teamDepartment) return `Показатели отдела · ${employeesLabel(page.teamDepartment.employees.length)}`;
  const scope = page.scope.status === "ready" ? page.scope.departments : [];
  const count = employeesLabel(page.employeeCount);
  return scope.length === 1 ? `${scope[0].department_name} · ${count}` : `Общие показатели · ${count}`;
}

/** The employees under the team numbers, the lowest percentage first. */
function TeamPanel({ page }: { page: UseTaskStatsPageResult }) {
  const { view } = page;
  if (view?.status !== "ready" || !view.members || view.members.length === 0) return null;
  const departments = new Set(view.members.map((m) => `${m.company_id}:${m.department_id ?? ""}`));
  return (
    <Panel className="overflow-hidden">
      <div className="px-5 pb-2 pt-5">
        <h3 className="text-lg font-semibold">Сотрудники</h3>
        <p className="text-sm text-ui-fg/55">Процент выполнения каждого · сначала самый низкий</p>
      </div>
      <TeamMembers members={view.members} withDepartments={departments.size > 1} onSelect={(id) => page.selectEmployee(id)} />
    </Panel>
  );
}

function EmployeePanel({ page }: { page: UseTaskStatsPageResult }) {
  const caption =
    page.departments.length === 1
      ? `${page.departments[0].department_name} · ${employeesLabel(page.employeeCount)}`
      : `Сотрудники · ${page.employeeCount}`;
  return (
    <Panel className="flex max-h-[calc(100vh-180px)] flex-col gap-3 p-3">
      <p className="px-1.5 pt-1 text-[13px] text-ui-fg/55">{caption}</p>
      <label className="flex h-10 items-center gap-2 rounded-xl bg-ui-surface px-3">
        <Search className="size-4 shrink-0 text-ui-fg/45" aria-hidden />
        <span className="sr-only">Поиск сотрудника</span>
        <input
          type="search"
          value={page.search}
          onChange={(event) => page.setSearch(event.target.value)}
          placeholder="Поиск"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ui-fg placeholder:text-ui-fg/40 focus:outline-none"
        />
      </label>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {page.search.trim() === "" ? (
          <button
            type="button"
            aria-current={page.team && !page.teamDepartment ? "true" : undefined}
            onClick={() => page.selectEmployee("team")}
            className={cn(
              "mb-1 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
              page.team && !page.teamDepartment ? "bg-[#4A2C20]" : "hover:bg-ui-fg/[0.05]",
            )}
          >
            <TeamAvatar className="size-9" />
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-medium">Вся команда</span>
              <span className="block truncate text-xs text-ui-fg/55">Общие показатели</span>
            </span>
          </button>
        ) : null}
        {page.departments.length === 0 ? (
          <p className="py-6 text-center text-sm text-ui-fg/55">Никого не нашли</p>
        ) : (
          page.departments.map((department) => (
            <div key={`${department.company_id}:${department.department_id ?? ""}`} className="flex flex-col gap-0.5 pb-2">
              {page.canPickDepartment ? (
                // The head of a company: a department heading opens the numbers of that department.
                <button
                  type="button"
                  aria-current={page.teamDepartment && departmentKey(page.teamDepartment) === departmentKey(department) ? "true" : undefined}
                  onClick={() => page.selectDepartment(department)}
                  className={cn(
                    "mt-1 flex w-full items-center justify-between gap-2 rounded-lg px-2 pb-1.5 pt-2 text-left text-xs font-semibold uppercase tracking-[0.05em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
                    page.teamDepartment && departmentKey(page.teamDepartment) === departmentKey(department)
                      ? "bg-[#4A2C20] text-ui-fg"
                      : "text-ui-fg/40 hover:bg-ui-fg/[0.05] hover:text-ui-fg/70",
                  )}
                >
                  <span className="truncate">{department.department_name}</span>
                  <span className="shrink-0 normal-case tracking-normal text-ui-accent">Показатели</span>
                </button>
              ) : null}
              {department.employees.map((employee) => {
                const selected = page.employee?.id === employee.id;
                return (
                  <button
                    key={employee.id}
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    onClick={() => page.selectEmployee(employee.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
                      selected ? "bg-[#4A2C20]" : "hover:bg-ui-fg/[0.05]",
                    )}
                  >
                    <Avatar name={employee.full_name} className="size-9 text-[13px]" />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium">{employee.full_name}</span>
                      {employee.position ? <span className="block truncate text-xs text-ui-fg/55">{employee.position}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function StatsBody({ page }: { page: UseTaskStatsPageResult }) {
  const { view } = page;
  if (!view || view.status === "loading") {
    return (
      <Panel>
        <StatsLoading className="py-24" />
      </Panel>
    );
  }
  if (view.status === "error") {
    return (
      <Panel>
        <StatsError reason={view.reason} onRetry={page.retry} />
      </Panel>
    );
  }
  const { stats } = view;
  const content = statsContent(stats);
  if (content === "empty") {
    return (
      <Panel className="flex min-h-[520px] items-center justify-center">
        <EmptyState
          icon={<Inbox />}
          title={emptyTitle(page.period)}
          description={"Статистика появится, когда будут назначены задачи со сроком.\nБлок показателей и графики не показываются"}
        />
      </Panel>
    );
  }
  return <StatsGrid stats={stats} period={page.period} todayKey={page.todayKey} noDue={content === "noDue"} />;
}

function Kpi({ label, dot, children }: { label: string; dot?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-l border-ui-fg/[0.08] px-6 py-6">
      <p className="flex items-center gap-1.5 text-sm text-ui-fg/60">
        {dot ? <span aria-hidden className={cn("size-2 rounded-full", dot)} /> : null}
        {label}
      </p>
      {children}
    </div>
  );
}

function StatsGrid({ stats, period, todayKey, noDue }: { stats: TaskStats; period: StatsPeriod; todayKey: string; noDue: boolean }) {
  const phrase = periodPhrase(period, todayKey);
  const notes = [smallSampleNote(stats, "в периоде"), endedNote(stats)].filter(Boolean) as string[];
  const completedHint =
    stats.completed_in_period === 0
      ? `${phrase} задачи не завершались`
      : period.kind === "week" && phrase === "на этой неделе"
        ? "завершены на этой неделе"
        : `завершены ${phrase}, срок может быть вне периода`;
  const chartRange = period.kind === "week" ? shortRangeLabel(period) : rangeLabel(period);

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <div className="grid grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] [&>*:first-child]:border-l-0">
          <div className="flex flex-col gap-1 px-6 py-6">
            <p className="text-sm text-ui-fg/60">Процент выполнения</p>
            {noDue ? (
              <>
                <p className="text-[26px] font-bold leading-[40px] text-ui-fg/85">Не рассчитывается</p>
                <p className="text-sm text-ui-fg/60">{phrase} нет задач со сроком</p>
              </>
            ) : (
              <>
                <p className="text-[44px] font-bold leading-[52px]">{stats.completion_percent}%</p>
                <Meter value={share(stats.completed, stats.total)} className="mt-2" />
                <p className="mt-3 text-sm text-ui-fg/80">
                  {stats.completed} из {stats.total} задач со сроком
                </p>
              </>
            )}
          </div>
          <Kpi label="Всего задач">
            <p className="text-[32px] font-bold leading-10">{stats.total}</p>
            <p className="text-sm text-ui-fg/55">со сроком в периоде</p>
          </Kpi>
          <Kpi label="Выполнено" dot="bg-ui-done">
            {noDue ? (
              <p className="text-[32px] font-bold leading-10">—</p>
            ) : (
              <>
                <p className="text-[32px] font-bold leading-10">{stats.completed}</p>
                <p className="text-sm text-ui-fg/55">вовремя — {stats.completed_on_time}</p>
              </>
            )}
          </Kpi>
          <Kpi label="Не выполнено" dot="bg-ui-fg/45">
            {noDue ? (
              <p className="text-[32px] font-bold leading-10">—</p>
            ) : (
              <>
                <p className="text-[32px] font-bold leading-10">{stats.not_completed}</p>
                <p className={cn("text-sm", stats.overdue > 0 ? "text-ui-danger" : "text-ui-fg/55")}>просрочено — {stats.overdue}</p>
              </>
            )}
          </Kpi>
        </div>
        {notes.length > 0 ? (
          <div className="flex flex-col gap-1 border-t border-ui-fg/[0.08] px-6 py-3">
            {notes.map((note) => (
              <InfoLine key={note}>{note}</InfoLine>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5 border-t border-ui-fg/[0.08] px-6 py-4 text-sm text-ui-fg/60">
          <p>
            Выполнено за период: <b className="font-bold text-ui-fg">{stats.completed_in_period}</b> — {completedHint}
          </p>
          <p>
            Без срока: <b className="font-bold text-ui-fg">{stats.without_due}</b> — открытые задачи без дедлайна, в процент не входят
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel className="p-5">
          <h3 className="text-lg font-semibold">Динамика выполнения</h3>
          <p className="mb-5 text-sm text-ui-fg/55">Завершено задач по дням · {chartRange}</p>
          <DailyChart stats={stats} period={period} height={160} withMonthTicks />
        </Panel>
        <Panel className="p-5">
          <h3 className="text-lg font-semibold">По приоритетам</h3>
          <p className="mb-5 text-sm text-ui-fg/55">Выполнено из задач со сроком в периоде</p>
          <PriorityBars stats={stats} compact />
        </Panel>
      </div>
    </div>
  );
}
