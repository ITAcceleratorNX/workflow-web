export const ROLE_TRANSLATIONS: Record<string, string> = {
  client: "Клиент",
  executor: "Исполнитель",
  "admin-worker": "Администратор офиса",
  "department-head": "Офис менеджер",
  manager: "Руководитель",
};

export const ROLES_WITH_LOGS = ["admin-worker", "department-head", "manager"] as const;

export type ProfileTab = "profile" | "password" | "notifications" | "logs";
