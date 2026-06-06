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
