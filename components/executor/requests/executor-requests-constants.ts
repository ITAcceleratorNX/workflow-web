export type ExecutorRequestsTab = "tasks" | "myTasks" | "completed";

export const EXECUTOR_REQUEST_TABS: { key: ExecutorRequestsTab; label: string }[] = [
  { key: "tasks", label: "Мои задачи" },
  { key: "myTasks", label: "Мои заявки" },
  { key: "completed", label: "Завершенные" },
];

export const EXECUTOR_EMPTY_MESSAGES: Record<ExecutorRequestsTab, string> = {
  tasks: "Нет назначенных задач",
  myTasks: "У вас пока нет заявок",
  completed: "Нет завершенных задач",
};

function getTaskTypeOrder(type: string) {
  switch (type) {
    case "urgent":
      return 1;
    case "normal":
      return 2;
    case "planned":
      return 3;
    default:
      return 99;
  }
}

export function sortAssignedTasksByType<T extends { request_type?: string; type?: string }>(
  tasks: T[]
): T[] {
  return [...tasks].sort(
    (a, b) =>
      getTaskTypeOrder(a.request_type || a.type || "") -
      getTaskTypeOrder(b.request_type || b.type || "")
  );
}
