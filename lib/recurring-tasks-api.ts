import api from "@/lib/api";

export type RecurrenceType = "daily" | "weekly" | "monthly" | "yearly";
export type RecurringStatus = "active" | "paused" | "completed";
export type TaskInstanceStatus = "pending" | "completed" | "overdue" | "skipped";

export interface RecurringTask {
  id: number;
  location: string;
  location_detail?: string;
  description?: string;
  request_type: "recurring";
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  next_due_date: string;
  last_completed_date?: string;
  status: string;
  recurring_status: RecurringStatus;
  created_date: string;
  planned_date?: string;
  client?: {
    id: number;
    name: string;
    phone: string;
  };
  office?: {
    id: number;
    name: string;
  };
  executors?: {
    id: number;
    full_name: string;
    phone: string;
  }[];
  taskInstances?: TaskInstance[];
  requests?: Array<{
    id: number;
    title: string;
    description: string;
    status: string;
    category_id: number;
    is_long_term?: boolean;
    category?: {
      id: number;
      name: string;
    };
    requestExecutors?: Array<{
      id: number;
      request_id: number;
      executor_id: number;
      role: string;
      executor?: {
        id: number;
        user_id: number;
        department_id: number;
        specialty: string;
        user?: {
          id: number;
          full_name: string;
          phone: string;
        };
      };
    }>;
  }>;
  photos?: Array<{
    id: number;
    photo_url: string;
    type: "before" | "after";
  }>;
}

export interface TaskInstance {
  id: number;
  due_date: string;
  completed_date?: string;
  status: TaskInstanceStatus;
  notes?: string;
  taskCompletedByUser?: {
    id: number;
    name: string;
    phone: string;
  };
  recurringTaskGroup?: {
    id: number;
    location: string;
    location_detail?: string;
    recurrence_type: RecurrenceType;
    recurrence_interval: number;
  };
}

export interface TaskStats {
  total_instances: number;
  completed_instances: number;
  pending_instances: number;
  overdue_instances: number;
  completion_rate: number;
}

export interface CreateRecurringTaskPayload {
  location: string;
  location_detail?: string;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  start_date: string;
  request_type?: string;
}

export const createRecurringTask = (data: CreateRecurringTaskPayload) =>
  api.post<RecurringTask>("/recurring-tasks", data);

export const getRecurringTasks = (page = 1, pageSize = 10) =>
  api.get<{ tasks: RecurringTask[]; pagination: unknown }>(
    `/recurring-tasks?page=${page}&pageSize=${pageSize}`
  );

export const getRecurringTaskById = (id: number) => api.get<RecurringTask>(`/recurring-tasks/${id}`);

export const updateRecurringTask = (id: number, data: Partial<RecurringTask>) =>
  api.put<RecurringTask>(`/recurring-tasks/${id}`, data);

export const deleteRecurringTask = (id: number) => api.delete(`/recurring-tasks/${id}`);

export const toggleRecurringTask = (id: number, action: "pause" | "resume") =>
  api.patch<RecurringTask>(`/recurring-tasks/${id}/toggle`, { action });

export const updateRecurringTaskStatus = (id: number, recurringStatus: RecurringStatus) =>
  api.patch<RecurringTask>(`/recurring-tasks/${id}/status`, { recurring_status: recurringStatus });

export const assignRecurringTaskExecutor = (id: number, executorId: number) =>
  api.patch<RecurringTask>(`/recurring-tasks/${id}/assign-executor`, { executor_id: executorId });

export const changeRecurringTaskExecutor = (id: number, executorId: number) =>
  api.patch<RecurringTask>(`/recurring-tasks/${id}/change-executor`, { executor_id: executorId });

export const getTaskStats = (id: number) => api.get<TaskStats>(`/recurring-tasks/${id}/stats`);

export const getTaskInstances = (requestGroupId: number, page = 1, pageSize = 10) =>
  api.get<{ instances: TaskInstance[]; pagination: unknown }>(
    `/recurring-tasks/${requestGroupId}/instances?page=${page}&pageSize=${pageSize}`
  );

export const completeTaskInstance = (instanceId: number, notes?: string) =>
  api.patch<TaskInstance>(`/recurring-tasks/instances/${instanceId}/complete`, { notes });

export const skipTaskInstance = (instanceId: number, notes?: string) =>
  api.patch<TaskInstance>(`/recurring-tasks/instances/${instanceId}/skip`, { notes });

export const getUpcomingTasks = (limit = 10) =>
  api.get<{ data: TaskInstance[] }>(`/recurring-tasks/upcoming?limit=${limit}`);

export const getTaskCalendar = (startDate: string, endDate: string) =>
  api.get<{ data: TaskInstance[] }>(
    `/recurring-tasks/calendar?start_date=${startDate}&end_date=${endDate}`
  );

export const importRecurringTasksFromExcel = (formData: FormData) =>
  api.post("/recurring-tasks/import-excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
