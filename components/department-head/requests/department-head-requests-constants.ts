export type DepartmentHeadRequestsTab = "incoming" | "my-requests" | "recurring";

export const DEPARTMENT_HEAD_REQUEST_TABS: {
  key: DepartmentHeadRequestsTab;
  label: string;
}[] = [
  { key: "incoming", label: "Входящие" },
  { key: "my-requests", label: "Мои" },
  { key: "recurring", label: "Повторяющиеся" },
];

export const DEPARTMENT_HEAD_TAB_TITLES: Record<DepartmentHeadRequestsTab, string> = {
  incoming: "Входящие заявки",
  "my-requests": "Мои заявки",
  recurring: "Повторяющиеся задачи",
};

export const DEPARTMENT_HEAD_EMPTY_MESSAGES: Partial<Record<DepartmentHeadRequestsTab, string>> = {
  incoming: "Нет входящих заявок",
  "my-requests": "У вас пока нет заявок",
};

export interface DepartmentHeadExecutor {
  id: number;
  executor_id: number;
  user: { id: number; full_name: string; phone?: string; role: string };
  specialty: string;
  rating: number;
  workload: number;
}

/** API /executors?categoryId= → формат модалки назначения */
export function mapExecutorInCategoryToAssignModal(executor: {
  id: number;
  specialty?: string;
  user?: { id: number; full_name: string; phone?: string; role?: string };
}): DepartmentHeadExecutor {
  return {
    id: executor.id,
    executor_id: executor.id,
    user: {
      id: executor.user?.id ?? 0,
      full_name: executor.user?.full_name ?? `Исполнитель #${executor.id}`,
      phone: executor.user?.phone,
      role: executor.user?.role ?? "executor",
    },
    specialty: executor.specialty ?? "",
    rating: 0,
    workload: 0,
  };
}
