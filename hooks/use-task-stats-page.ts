"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { todayTaskDateKey } from "@/lib/dateTimeUtils";
import {
  containsDay,
  departmentKey,
  filterDepartments,
  monthPeriod,
  periodOfKind,
  shiftPeriod,
  sortTeamMembers,
  teamAsStats,
  type StatsDepartment,
  type StatsEmployee,
  type StatsPeriod,
  type StatsPeriodKind,
  type TaskStats,
  type TeamMemberStats,
} from "@/lib/task-stats";
import { fetchStatsEmployees, fetchTaskStats, fetchTeamStats } from "@/lib/task-stats-api";
import { useUserTasksInvalidateStore } from "@/stores/user-tasks-invalidate-store";

export type StatsTab = "my" | "employees";
const BASE_PATH = "/client/tasks/stats";
/** `?employee=team`: «Вся команда» instead of one employee; `&group=3:7` narrows it to one department. */
const TEAM_PARAM = "team";
const GROUP_PARAM = "group";

type ScopeState =
  | { status: "loading" }
  | { status: "ready"; departments: StatsDepartment[] }
  | { status: "error" };

/** Loaded statistics carry the request they answer: a screen shows only those of its own filter. */
type StatsState =
  | { key: string; status: "loading" }
  | { key: string; status: "ready"; stats: TaskStats; members: TeamMemberStats[] | null }
  | { key: string; status: "error"; reason: "forbidden" | "failed" };

function employeeIdParam(value: string | null): number | null {
  return value && /^[1-9]\d{0,9}$/.test(value) ? Number(value) : null;
}

/**
 * «Статистика задач»: own statistics («Моя»), or, for the head of a company or a department,
 * the whole team or an employee («Сотрудники»). The tab and the choice live in the URL
 * (?view=employees&employee=ID|team[&group=3:7]), so the phone «Назад» returns to the list. The period stays
 * on screen. `teamByDefault` (desktop) shows the team while nobody is chosen.
 */
export function useTaskStatsPage({ teamByDefault = false }: { teamByDefault?: boolean } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const todayKey = useMemo(() => todayTaskDateKey(), []);
  const invalidation = useUserTasksInvalidateStore((s) => s.version);

  const [period, setPeriod] = useState<StatsPeriod>(() => monthPeriod(todayKey));
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<ScopeState>({ status: "loading" });
  const [state, setState] = useState<StatsState | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const canViewEmployees = scope.status === "ready" && scope.departments.length > 0;
  const requestedTab: StatsTab = searchParams.get("view") === "employees" ? "employees" : "my";
  const tab: StatsTab = requestedTab === "employees" && canViewEmployees ? "employees" : "my";
  const employeeParam = searchParams.get("employee");
  const requestedEmployeeId = employeeIdParam(employeeParam);
  const team = tab === "employees" && (employeeParam === TEAM_PARAM || (employeeParam == null && teamByDefault));

  const employees = useMemo(
    () => (scope.status === "ready" ? scope.departments.flatMap((d) => d.employees) : []),
    [scope],
  );
  // Only someone the server listed: an id typed into the URL opens nothing by itself.
  const employee: StatsEmployee | null =
    tab === "employees" ? employees.find((e) => e.id === requestedEmployeeId) ?? null : null;
  // One department of the team, only one the server listed and only while there are several.
  const groupParam = searchParams.get(GROUP_PARAM);
  const canPickDepartment = scope.status === "ready" && scope.departments.length > 1;
  const teamDepartment: StatsDepartment | null =
    team && canPickDepartment && groupParam ? scope.departments.find((d) => departmentKey(d) === groupParam) ?? null : null;
  const employeeDepartment =
    employee && scope.status === "ready"
      ? scope.departments.find((d) => d.employees.some((e) => e.id === employee.id)) ?? null
      : null;

  const loadScope = useCallback((signal?: AbortSignal) => {
    setScope({ status: "loading" });
    fetchStatsEmployees(signal)
      .then((result) => setScope({ status: "ready", departments: result.departments }))
      .catch((error) => {
        if (!signal?.aborted) setScope(isAxiosError(error) && error.response?.status === 403 ? { status: "ready", departments: [] } : { status: "error" });
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadScope(controller.signal);
    return () => controller.abort();
  }, [loadScope]);

  // Whose statistics: own on «Моя», the team or the chosen employee on «Сотрудники», nobody while the list shows.
  const target: number | "me" | "team" | null = tab === "my" ? "me" : team ? "team" : employee?.id ?? null;
  const groupKey = teamDepartment ? departmentKey(teamDepartment) : "";
  const requestKey = target == null ? null : `${target}|${groupKey}|${period.from}|${period.to}`;

  useEffect(() => {
    if (requestKey == null || target == null) return;
    const controller = new AbortController();
    // The same filter loaded again keeps its numbers until the new ones come; another filter never does.
    setState((prev) => (prev?.key === requestKey && prev.status === "ready" ? prev : { key: requestKey, status: "loading" }));
    const load =
      target === "team"
        ? fetchTeamStats(period, teamDepartment, controller.signal).then((r) => ({ stats: teamAsStats(r), members: sortTeamMembers(r.employees) }))
        : fetchTaskStats(period, target === "me" ? null : target, controller.signal).then((stats) => ({ stats, members: null }));
    load
      .then((loaded) => setState({ key: requestKey, status: "ready", ...loaded }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        const forbidden = isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 404);
        setState({ key: requestKey, status: "error", reason: forbidden ? "forbidden" : "failed" });
      });
    return () => controller.abort();
    // A task changed elsewhere (invalidation) or «Повторить» (reloadToken) loads the same filter again.
  }, [requestKey, target, teamDepartment, period, invalidation, reloadToken]);

  // Back to the screen after editing tasks in another tab: the numbers may have changed.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setReloadToken((n) => n + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const current = state && state.key === requestKey ? state : null;
  const view = current ?? (requestKey ? ({ key: requestKey, status: "loading" } as const) : null);

  const navigate = useCallback(
    (change: (params: URLSearchParams) => void, mode: "push" | "replace") => {
      const params = new URLSearchParams(searchParams.toString());
      change(params);
      const query = params.toString();
      const href = query ? `${BASE_PATH}?${query}` : BASE_PATH;
      if (mode === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [router, searchParams],
  );

  const setTab = useCallback(
    (next: StatsTab) =>
      navigate((params) => {
        if (next === "employees") params.set("view", "employees");
        else params.delete("view");
        params.delete("employee");
      }, "replace"),
    [navigate],
  );

  /** Phone: the team or an employee opens over the list (push, «Назад» returns); desktop replaces the choice. */
  const selectEmployee = useCallback(
    (id: number | "team" | null, mode: "push" | "replace" = "replace") =>
      navigate((params) => {
        params.set("view", "employees");
        params.delete(GROUP_PARAM);
        if (id == null) params.delete("employee");
        else params.set("employee", id === "team" ? TEAM_PARAM : String(id));
      }, mode),
    [navigate],
  );

  /** One department's numbers, in the place of «Вся команда»; null returns to the whole team. */
  const selectDepartment = useCallback(
    (department: StatsDepartment | null, mode: "push" | "replace" = "replace") =>
      navigate((params) => {
        params.set("view", "employees");
        params.set("employee", TEAM_PARAM);
        if (department) params.set(GROUP_PARAM, departmentKey(department));
        else params.delete(GROUP_PARAM);
      }, mode),
    [navigate],
  );

  const setPeriodKind = useCallback(
    (kind: Exclude<StatsPeriodKind, "custom">) => {
      // The week or month of today when it is in view, otherwise of the start of the shown period.
      setPeriod((current) => periodOfKind(kind, containsDay(current, todayKey) ? todayKey : current.from));
    },
    [todayKey],
  );

  const stepPeriod = useCallback((delta: -1 | 1) => setPeriod((current) => shiftPeriod(current, delta)), []);

  return {
    todayKey,
    tab,
    setTab,
    canViewEmployees,
    scope,
    retryScope: () => loadScope(),
    departments: scope.status === "ready" ? filterDepartments(scope.departments, search) : [],
    employeeCount: employees.length,
    search,
    setSearch,
    employee,
    employeeDepartment,
    team,
    teamDepartment,
    canPickDepartment,
    selectDepartment,
    selectEmployee,
    period,
    setPeriod,
    setPeriodKind,
    stepPeriod,
    view,
    retry: () => setReloadToken((n) => n + 1),
  };
}

export type UseTaskStatsPageResult = ReturnType<typeof useTaskStatsPage>;
