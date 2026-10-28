"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { todayTaskDateKey } from "@/lib/dateTimeUtils";
import {
  containsDay,
  filterDepartments,
  monthPeriod,
  periodOfKind,
  shiftPeriod,
  type StatsDepartment,
  type StatsEmployee,
  type StatsPeriod,
  type StatsPeriodKind,
  type TaskStats,
} from "@/lib/task-stats";
import { fetchStatsEmployees, fetchTaskStats } from "@/lib/task-stats-api";
import { useUserTasksInvalidateStore } from "@/stores/user-tasks-invalidate-store";

export type StatsTab = "my" | "employees";
const BASE_PATH = "/client/tasks/stats";

type ScopeState =
  | { status: "loading" }
  | { status: "ready"; departments: StatsDepartment[] }
  | { status: "error" };

/** Loaded statistics carry the request they answer: a screen shows only those of its own filter. */
type StatsState =
  | { key: string; status: "loading" }
  | { key: string; status: "ready"; stats: TaskStats }
  | { key: string; status: "error"; reason: "forbidden" | "failed" };

function employeeIdParam(value: string | null): number | null {
  return value && /^[1-9]\d{0,9}$/.test(value) ? Number(value) : null;
}

/**
 * «Статистика задач»: own statistics («Моя»), or, for the head of a company or a department,
 * an employee's («Сотрудники»). The tab and the employee live in the URL (?view=employees&employee=ID),
 * so the phone «Назад» returns from an employee to the list. The period stays on screen.
 */
export function useTaskStatsPage() {
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
  const requestedEmployeeId = employeeIdParam(searchParams.get("employee"));

  const employees = useMemo(
    () => (scope.status === "ready" ? scope.departments.flatMap((d) => d.employees) : []),
    [scope],
  );
  // Only someone the server listed: an id typed into the URL opens nothing by itself.
  const employee: StatsEmployee | null =
    tab === "employees" ? employees.find((e) => e.id === requestedEmployeeId) ?? null : null;
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

  // Whose statistics: own on «Моя», the chosen employee on «Сотрудники», nobody while the list shows.
  const target: number | "me" | null = tab === "my" ? "me" : employee?.id ?? null;
  const requestKey = target == null ? null : `${target}|${period.from}|${period.to}`;

  useEffect(() => {
    if (requestKey == null || target == null) return;
    const controller = new AbortController();
    // The same filter loaded again keeps its numbers until the new ones come; another filter never does.
    setState((prev) => (prev?.key === requestKey && prev.status === "ready" ? prev : { key: requestKey, status: "loading" }));
    fetchTaskStats(period, target === "me" ? null : target, controller.signal)
      .then((stats) => setState({ key: requestKey, status: "ready", stats }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        const forbidden = isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 404);
        setState({ key: requestKey, status: "error", reason: forbidden ? "forbidden" : "failed" });
      });
    return () => controller.abort();
    // A task changed elsewhere (invalidation) or «Повторить» (reloadToken) loads the same filter again.
  }, [requestKey, target, period, invalidation, reloadToken]);

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

  /** Phone: the employee opens over the list (push, «Назад» returns); desktop replaces the choice. */
  const selectEmployee = useCallback(
    (id: number | null, mode: "push" | "replace" = "replace") =>
      navigate((params) => {
        params.set("view", "employees");
        if (id == null) params.delete("employee");
        else params.set("employee", String(id));
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
