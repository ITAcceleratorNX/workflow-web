export type ManagerRequestPeriod = "all" | "week" | "month" | "year";

export interface ManagerOffice {
  id: number;
  name: string;
  city?: string;
  address?: string;
}

export const MANAGER_PERIOD_OPTIONS: { value: ManagerRequestPeriod; label: string }[] = [
  { value: "all", label: "Весь период" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "year", label: "Год" },
];

export type ManagerRequestsTab = "all" | "rejected" | "deleted";

export const MANAGER_REQUEST_TABS: { key: ManagerRequestsTab; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "rejected", label: "Отклонённые" },
  { key: "deleted", label: "Журнал удалений" },
];
