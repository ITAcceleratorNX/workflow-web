import api from "@/lib/api";
import { normalizeRecurrenceFromApi, type TaskRecurrencePayload } from "@/lib/task-recurrence";

export type RecurrenceType = TaskRecurrencePayload["recurrence_type"];
export type RecurrenceCustomUnit = TaskRecurrencePayload["recurrence_custom_unit"];

export type TaskPriority = "low" | "medium" | "high";

export interface TaskTeamRef {
  id: number;
  name: string;
  leader_id: number;
  leader?: { id: number; full_name: string };
  members?: { id: number; full_name: string }[];
}

export interface TaskExecutorRef {
  id: number;
  full_name: string;
}

export interface UserTask {
  id: number;
  creator_id: number;
  title: string;
  completed: boolean;
  completed_at: string | null;
  scheduled_at: string | null;
  deadline_from: string | null;
  deadline_to: string | null;
  deadline_time: string | null;
  remind_at: string | null;
  priority: TaskPriority;
  reminders_disabled: boolean;
  remind_before_minutes: number | null;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_custom_unit: RecurrenceCustomUnit | null;
  recurrence_weekdays: number[] | null;
  created_at: string;
  updated_at: string;
  assignee_ids: number[];
  assignees?: { id: number; full_name: string }[];
  team_id?: number | null;
  executor_id?: number | null;
  team?: TaskTeamRef | null;
  executor?: TaskExecutorRef | null;
  completed_by?: number | null;
  completed_by_user?: TaskExecutorRef | null;
  completedByUser?: TaskExecutorRef | null;
  inbox: boolean;
}

export interface CalendarTask {
  id: number;
  title: string;
  scheduled_at: string;
  completed: boolean;
  creator_id?: number;
  assignee_ids?: number[];
  team_id?: number | null;
  executor_id?: number | null;
  team?: TaskTeamRef | null;
  executor?: TaskExecutorRef | null;
}

export interface TodayStats {
  todayCompleted: number;
  todayTotal: number;
  overdueCount?: number;
}

export interface UserTasksListResponse {
  tasks: UserTask[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type TaskFilter = "all" | "today" | "overdue";
export type TaskListView = "inbox" | "list_today" | "list_upcoming" | "list_completed";

function unwrapTaskPayload(raw: unknown): UserTask {
  let t: UserTask | undefined;
  if (raw && typeof raw === "object" && "task" in raw) {
    t = (raw as { task?: UserTask }).task;
  } else {
    t = raw as UserTask | undefined;
  }
  if (!t) return raw as UserTask;
  return normalizeUserTaskRow(t);
}

function normalizeUserTaskRow(t: UserTask): UserTask {
  const rec = normalizeRecurrenceFromApi(t);
  const completedByUser = t.completed_by_user ?? t.completedByUser ?? undefined;
  return { ...t, ...rec, inbox: Boolean(t.inbox), completed_by_user: completedByUser };
}

function extractError(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Ошибка запроса"
  );
}

export async function getUserTasks(params: {
  filter?: TaskFilter;
  view?: TaskListView;
  date?: string;
  today?: string;
  from_date?: string;
  to_date?: string;
  completed_on?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
  light?: boolean | "1";
}): Promise<{ ok: true; data: UserTasksListResponse } | { ok: false; error: string }> {
  try {
    const searchParams: Record<string, string> = {};
    if (params.filter) searchParams.filter = params.filter;
    if (params.view) searchParams.view = params.view;
    if (params.date) searchParams.date = params.date;
    if (params.today) searchParams.today = params.today;
    if (params.from_date) searchParams.from_date = params.from_date;
    if (params.to_date) searchParams.to_date = params.to_date;
    if (params.completed_on) searchParams.completed_on = params.completed_on;
    if (params.start_date) searchParams.start_date = params.start_date;
    if (params.end_date) searchParams.end_date = params.end_date;
    if (params.page != null) searchParams.page = String(params.page);
    if (params.pageSize != null) searchParams.pageSize = String(params.pageSize);
    if (params.light) searchParams.light = "1";

    const res = await api.get<UserTasksListResponse>("/user-tasks", {
      params: Object.keys(searchParams).length ? searchParams : undefined,
    });
    return {
      ok: true,
      data: {
        ...res.data,
        tasks: res.data.tasks.map((t) => normalizeUserTaskRow(t)),
      },
    };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function getUserTasksCalendar(
  startDate: string,
  endDate: string,
): Promise<{ ok: true; data: { tasks: CalendarTask[] } } | { ok: false; error: string }> {
  try {
    const res = await api.get<{ tasks: CalendarTask[] }>("/user-tasks/calendar", {
      params: { start_date: startDate, end_date: endDate },
    });
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function getTodayStats(): Promise<
  { ok: true; data: TodayStats } | { ok: false; error: string }
> {
  try {
    const res = await api.get<TodayStats>("/user-tasks/today-stats");
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function getUserTask(
  id: number,
): Promise<{ ok: true; data: UserTask } | { ok: false; error: string }> {
  try {
    const res = await api.get<{ task: UserTask } | UserTask>(`/user-tasks/${id}`);
    return { ok: true, data: unwrapTaskPayload(res.data) };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function createUserTask(body: {
  title: string;
  priority?: TaskPriority;
  scheduled_at?: string | null;
  deadline_from?: string | null;
  deadline_to?: string | null;
  deadline_time?: string | null;
  assignee_ids?: number[];
  team_id?: number | null;
  executor_id?: number | null;
  reminders_disabled?: boolean;
  remind_before_minutes?: number | null;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  recurrence_custom_unit?: RecurrenceCustomUnit | null;
  recurrence_weekdays?: number[] | null;
  inbox?: boolean;
}): Promise<{ ok: true; data: UserTask } | { ok: false; error: string }> {
  try {
    const res = await api.post<{ task: UserTask } | UserTask>("/user-tasks", body);
    return { ok: true, data: unwrapTaskPayload(res.data) };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateUserTask(
  id: number,
  body: Partial<{
    title: string;
    priority: TaskPriority;
    completed: boolean;
    scheduled_at: string | null;
    deadline_from: string | null;
    deadline_to: string | null;
    deadline_time: string | null;
    assignee_ids: number[];
    team_id: number | null;
    executor_id: number | null;
    reminders_disabled: boolean;
    remind_at: string | null;
    remind_before_minutes: number | null;
    recurrence_type: RecurrenceType;
    recurrence_interval: number;
    recurrence_custom_unit: RecurrenceCustomUnit | null;
    recurrence_weekdays: number[] | null;
    inbox: boolean;
  }>,
): Promise<{ ok: true; data: UserTask } | { ok: false; error: string }> {
  try {
    const res = await api.patch<{ task: UserTask } | UserTask>(`/user-tasks/${id}`, body);
    return { ok: true, data: unwrapTaskPayload(res.data) };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function deleteUserTask(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.delete(`/user-tasks/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export function canEditUserTaskDetails(task: UserTask, userId: number | null | undefined): boolean {
  if (!task || userId == null) return false;
  if (task.creator_id === userId) return true;
  if (task.team_id == null) return false;
  const leaderId = task.team?.leader_id;
  return leaderId != null && leaderId === userId;
}
