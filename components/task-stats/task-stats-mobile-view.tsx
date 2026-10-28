"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Inbox, Search } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ChipTabs } from "@/components/ui/chip-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import type { StatsTab, UseTaskStatsPageResult } from "@/hooks/use-task-stats-page";
import {
  asOfLabel,
  completedInPeriodHint,
  emptyTitle,
  periodPhrase,
  periodTitle,
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
  endedNote,
  InfoLine,
  Meter,
  OpenSplitBar,
  PeriodStepper,
  PriorityBars,
  SectionLabel,
  smallSampleNote,
  SolidTabs,
  StatsError,
  StatsLoading,
} from "./task-stats-parts";
import { TaskStatsRangePicker } from "./task-stats-range-picker";

const PERIOD_TABS = [
  { value: "week" as const, label: "Неделя" },
  { value: "month" as const, label: "Месяц" },
  { value: "custom" as const, label: "Свои даты" },
];
const VIEW_TABS = [
  { value: "my" as const, label: "Моя" },
  { value: "employees" as const, label: "Сотрудники" },
];

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[18px] bg-ui-surface p-[18px]", className)}>{children}</section>;
}

/** Phone «Статистика задач» (Figma «Моя статистика», «Сотрудники отдела», «Статистика сотрудника» and the states). */
export function TaskStatsMobileView(page: UseTaskStatsPageResult) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { employee, tab, period } = page;
  const showList = tab === "employees" && !employee;

  return (
    <div className="flex min-h-[100dvh] flex-col gap-4 bg-ui-canvas px-4 pb-28 pt-[max(16px,env(safe-area-inset-top))] text-ui-fg">
      <div className="flex min-h-11 items-center">
        <button
          type="button"
          onClick={() => (employee ? page.selectEmployee(null) : router.back())}
          className="-ml-1 inline-flex min-h-11 items-center gap-1.5 text-lg text-ui-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
        >
          <ChevronLeft className="size-6" aria-hidden />
          {employee ? "Сотрудники" : "Назад"}
        </button>
      </div>

      {employee ? (
        <header className="-mt-1 flex items-center gap-3">
          <Avatar name={employee.full_name} className="size-12 text-lg" />
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-bold leading-7">{employee.full_name}</h1>
            <p className="truncate text-sm text-ui-fg/55">
              {[employee.position, page.employeeDepartment?.department_name].filter(Boolean).join(" · ")}
            </p>
          </div>
        </header>
      ) : (
        <h1 className="text-[30px] font-bold leading-9">Статистика задач</h1>
      )}

      {page.canViewEmployees && !employee ? (
        <SolidTabs<StatsTab> ariaLabel="Чья статистика" value={tab} options={VIEW_TABS} onSelect={page.setTab} size="lg" fill className="rounded-[14px]" />
      ) : null}

      {showList ? (
        <EmployeeList page={page} />
      ) : (
        <>
          <ChipTabs<StatsPeriodKind>
            ariaLabel="Период"
            value={period.kind}
            tabs={PERIOD_TABS}
            onChange={(kind) => (kind === "custom" ? setPickerOpen(true) : page.setPeriodKind(kind))}
          />
          {period.kind === "custom" ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="rounded-xl bg-ui-surface px-4 py-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
            >
              <p className="truncate text-[17px] font-semibold">{periodTitle(period)}</p>
              <p className="truncate text-xs text-ui-fg/55">
                {employee?.full_name ?? "Мои задачи"} · {asOfLabel(period, page.todayKey)}
              </p>
            </button>
          ) : (
            <PeriodStepper
              title={periodTitle(period)}
              subtitle={`${employee?.full_name ?? "Мои задачи"} · ${asOfLabel(period, page.todayKey)}`}
              canStep
              onStep={page.stepPeriod}
              titleClassName="text-[17px]"
            />
          )}
          <StatsBody page={page} />
        </>
      )}

      <BottomSheet open={pickerOpen} onOpenChange={setPickerOpen} title="Свои даты">
        <p className="-mt-2 mb-4 text-sm text-ui-fg/55">Выберите начало и конец периода</p>
        <TaskStatsRangePicker
          variant="sheet"
          initial={period}
          todayKey={page.todayKey}
          onCancel={() => setPickerOpen(false)}
          onApply={(next) => {
            page.setPeriod(next);
            setPickerOpen(false);
          }}
        />
      </BottomSheet>
    </div>
  );
}

function EmployeeList({ page }: { page: UseTaskStatsPageResult }) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex min-h-12 items-center gap-2.5 rounded-xl bg-ui-surface px-3.5">
        <Search className="size-5 shrink-0 text-ui-fg/45" aria-hidden />
        <span className="sr-only">Поиск сотрудника</span>
        <input
          type="search"
          value={page.search}
          onChange={(event) => page.setSearch(event.target.value)}
          placeholder="Поиск сотрудника"
          className="min-w-0 flex-1 bg-transparent text-[17px] text-ui-fg placeholder:text-ui-fg/40 focus:outline-none"
        />
      </label>
      {page.departments.length === 0 ? (
        <p className="py-8 text-center text-sm text-ui-fg/55">Никого не нашли</p>
      ) : (
        page.departments.map((department) => (
          <section key={`${department.company_id}:${department.department_id ?? ""}`} className="flex flex-col gap-2.5">
            <SectionLabel>
              {department.department_name} · {department.employees.length}
            </SectionLabel>
            <ul className="overflow-hidden rounded-[18px] bg-ui-surface">
              {department.employees.map((employee, index) => (
                <li key={employee.id} className={cn(index > 0 && "border-t border-ui-fg/[0.08]")}>
                  <button
                    type="button"
                    onClick={() => page.selectEmployee(employee.id, "push")}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-ui-fg/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ui-fg/70"
                  >
                    <Avatar name={employee.full_name} className="size-10 text-sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[17px] font-semibold">{employee.full_name}</span>
                      {employee.position ? <span className="block truncate text-sm text-ui-fg/55">{employee.position}</span> : null}
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-ui-fg/35" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function StatsBody({ page }: { page: UseTaskStatsPageResult }) {
  const { view } = page;
  if (!view || view.status === "loading") return <StatsLoading />;
  if (view.status === "error") return <StatsError reason={view.reason} onRetry={page.retry} />;
  const { stats } = view;
  const content = statsContent(stats);
  if (content === "empty") {
    return (
      <EmptyState
        className="py-24"
        icon={<Inbox />}
        title={emptyTitle(page.period)}
        description="Статистика появится, когда будут назначены задачи со сроком в этом периоде"
      />
    );
  }
  return <StatsSections stats={stats} period={page.period} todayKey={page.todayKey} forEmployee={page.employee != null} noDue={content === "noDue"} />;
}

function StatsSections({
  stats,
  period,
  todayKey,
  forEmployee,
  noDue,
}: {
  stats: TaskStats;
  period: StatsPeriod;
  todayKey: string;
  forEmployee: boolean;
  noDue: boolean;
}) {
  const phrase = periodPhrase(period, todayKey);
  const sample = smallSampleNote(stats, phrase);
  const ended = endedNote(stats);
  const periodLabel = period.kind === "month" ? periodTitle(period).split(" ")[0].toLowerCase() : periodTitle(period);

  return (
    <div className="flex flex-col gap-4">
      <SectionLabel>Показатели</SectionLabel>
      <Card className="flex flex-col">
        <p className="text-[15px] text-ui-fg/55">Процент выполнения</p>
        {noDue ? (
          <>
            <p className="mt-2 text-[26px] font-bold leading-8 text-ui-fg/85">Не рассчитывается</p>
            <p className="mt-2 text-sm text-ui-fg/55">
              {phrase[0].toUpperCase() + phrase.slice(1)} нет задач со сроком. Процент и показатели появятся, когда у задач будет срок в этом периоде
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 flex items-baseline gap-3">
              <span className="text-[44px] font-bold leading-[52px]">{stats.completion_percent}%</span>
              <span className="text-[17px] text-ui-fg/80">
                выполнено {stats.completed} из {stats.total}
              </span>
            </p>
            <Meter value={share(stats.completed, stats.total)} className="mt-3" />
            {sample ? (
              <InfoLine className="mt-3">{sample}</InfoLine>
            ) : (
              <p className="mt-3 text-[13px] text-ui-fg/55">
                {stats.total} — все задачи{forEmployee ? " сотрудника" : ""} со сроком {phrase}: и выполненные, и нет
              </p>
            )}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-ui-fg/[0.08] pt-4">
              <span className="flex items-center gap-2.5 text-[17px]">
                <span aria-hidden className="size-2 rounded-full bg-ui-done" />
                Выполнено вовремя
              </span>
              <span className="text-[17px] text-ui-fg/55">
                {stats.completed > 0 ? (
                  <>
                    <b className="font-bold text-ui-fg">{stats.completed_on_time}</b> из {stats.completed}
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-ui-fg/[0.08] pt-4">
              <span className="flex items-center gap-2.5 text-[17px]">
                <span aria-hidden className="size-2 rounded-full bg-ui-fg/45" />
                Не выполнено
              </span>
              <span className="text-[17px] text-ui-fg/55">
                <b className="font-bold text-ui-fg">{stats.not_completed}</b> из {stats.total}
              </span>
            </div>
            <OpenSplitBar stats={stats} className="mt-3" />
            <div className="mt-2.5 flex justify-between text-[13px]">
              <span className="flex items-center gap-1.5 text-ui-fg/55">
                <span aria-hidden className="size-2 rounded-[2px] bg-ui-fg/45" />
                {stats.on_track} в срок
              </span>
              <span className={cn("flex items-center gap-1.5", stats.overdue > 0 ? "text-ui-danger" : "text-ui-fg/55")}>
                <span aria-hidden className={cn("size-2 rounded-[2px]", stats.overdue > 0 ? "bg-ui-danger" : "bg-ui-fg/30")} />
                {stats.overdue} просрочено
              </span>
            </div>
            {ended ? <p className="mt-3 text-[13px] text-ui-fg/55">{ended}</p> : null}
          </>
        )}
      </Card>

      <SectionLabel>Отдельно от процента</SectionLabel>
      <Card className="flex flex-col py-1">
        <SeparateRow title="Выполнено за период" hint={completedInPeriodHint(period, todayKey)} value={stats.completed_in_period} />
        <SeparateRow title="Без срока" hint="Открытые задачи без дедлайна, в процент не входят" value={stats.without_due} divider />
      </Card>

      <SectionLabel>Графики</SectionLabel>
      <Card>
        <h3 className="text-lg font-semibold">Динамика выполнения</h3>
        <p className="mb-4 text-[13px] text-ui-fg/55">Завершено задач по дням · {periodLabel}</p>
        <DailyChart stats={stats} period={period} height={120} />
      </Card>
      <Card>
        <h3 className="text-lg font-semibold">По приоритетам</h3>
        <p className={cn("text-[13px] text-ui-fg/55", stats.total > 0 && "mb-4")}>
          {stats.total > 0 ? "Выполнено из задач со сроком в периоде" : "Нет задач со сроком в этом периоде"}
        </p>
        {stats.total > 0 ? <PriorityBars stats={stats} /> : null}
      </Card>
    </div>
  );
}

function SeparateRow({ title, hint, value, divider = false }: { title: string; hint: string; value: number; divider?: boolean }) {
  return (
    <div className={cn("flex items-center gap-4 py-3.5", divider && "border-t border-ui-fg/[0.08]")}>
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[13px] leading-[18px] text-ui-fg/55">{hint}</p>
      </div>
      <span className="text-[22px] font-bold">{value}</span>
    </div>
  );
}
