export type AdminWorkerRequestsTab = "incoming" | "my-requests" | "recurring";

export const ADMIN_WORKER_REQUEST_TABS: { key: AdminWorkerRequestsTab; label: string }[] = [
  { key: "incoming", label: "Входящие" },
  { key: "my-requests", label: "Мои" },
  { key: "recurring", label: "Повторяющиеся" },
];

export const ADMIN_WORKER_TAB_TITLES: Record<AdminWorkerRequestsTab, string> = {
  incoming: "Входящие заявки",
  "my-requests": "Мои заявки",
  recurring: "Повторяющиеся задачи",
};

export const ADMIN_WORKER_EMPTY_MESSAGES: Partial<Record<AdminWorkerRequestsTab, string>> = {
  incoming: "Нет входящих заявок",
  "my-requests": "У вас пока нет заявок",
};
