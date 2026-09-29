import api from "@/lib/api";
import type { TaskEvent } from "@/lib/task-history";
import type { TaskAssignmentType, UserTask } from "@/lib/user-tasks-api";

export { describeTaskEvent, type TaskEvent } from "@/lib/task-history";

/** Сотрудник в справочнике получателей. department_id: null — «Без отдела». */
export interface RecipientEmployee {
  id: number;
  full_name: string;
  position: string | null;
  department_id: number | null;
}

export interface RecipientDepartment {
  id: number;
  name: string;
}

export interface RecipientCompany {
  id: number;
  name: string;
  /** Для внешней компании: доступна целиком (можно назначить всей компании). Своя — всегда целиком. */
  whole: boolean;
  office?: { id: number; name: string } | null;
  departments: RecipientDepartment[];
  employees: RecipientEmployee[];
}

/** «Моя компания» + «Доступные компании» (через группы взаимодействия Администратора). */
export interface RecipientDirectory {
  my_company: RecipientCompany | null;
  available_companies: RecipientCompany[];
}

type RawDirectory = {
  my_company: Omit<RecipientCompany, "whole"> | null;
  available_companies: RecipientCompany[];
};

/** Выбор в поле «Исполнитель». Один тип назначения на задачу. */
export type RecipientSelection =
  | { type: "company"; company: { id: number; name: string } }
  | { type: "department"; company: { id: number; name: string }; department: RecipientDepartment }
  | { type: "users"; company: { id: number; name: string }; users: { id: number; full_name: string }[] }
  /** Пользователь без компании в оргструктуре — прежний поиск и executor_id. */
  | { type: "legacy_user"; user: { id: number; full_name: string } };

export type TaskAssignmentInput =
  | { type: "company"; company_id: number }
  | { type: "department"; department_id: number }
  | { type: "users"; user_ids: number[] };

export function toAssignmentInput(selection: RecipientSelection): TaskAssignmentInput | null {
  switch (selection.type) {
    case "company":
      return { type: "company", company_id: selection.company.id };
    case "department":
      return { type: "department", department_id: selection.department.id };
    case "users":
      return { type: "users", user_ids: selection.users.map((u) => u.id) };
    default:
      return null;
  }
}

/** Тело POST /user-tasks/:id/transfer: тот же выбор, что в поле «Исполнитель». */
export type TaskTransferInput = { assignment: TaskAssignmentInput } | { executor_id: number };

export function toTransferInput(selection: RecipientSelection): TaskTransferInput {
  if (selection.type === "legacy_user") return { executor_id: selection.user.id };
  return { assignment: toAssignmentInput(selection) as TaskAssignmentInput };
}

/** Новый получатель в подтверждении передачи: «Отдел Финансы», «Компания Extra», «Иван, Ольга». */
export function transferRecipientLabel(selection: RecipientSelection): string {
  switch (selection.type) {
    case "company":
      return `Компания ${selection.company.name}`;
    case "department":
      return `Отдел ${selection.department.name}`;
    case "users":
      return selection.users.map((u) => u.full_name).join(", ");
    case "legacy_user":
      return selection.user.full_name;
  }
}

/** Выбор целиком компании или отдела — перед созданием нужно подтверждение. */
export function massAssignmentConfirmText(selection: RecipientSelection | null): string | null {
  if (selection?.type === "company") {
    return `Задача будет назначена всем сотрудникам компании ${selection.company.name}. Продолжить?`;
  }
  if (selection?.type === "department") {
    return `Задача будет назначена всем сотрудникам отдела ${selection.department.name}. Продолжить?`;
  }
  return null;
}

export function recipientSelectionLabel(selection: RecipientSelection | null): string {
  if (!selection) return "Исполнитель";
  switch (selection.type) {
    case "company":
      return selection.company.name;
    case "department":
      return selection.department.name;
    case "users":
      return selection.users.length === 1
        ? selection.users[0].full_name
        : `${selection.users[0].full_name} +${selection.users.length - 1}`;
    case "legacy_user":
      return selection.user.full_name;
  }
}

/** Подпись получателя групповой задачи с API. */
export function groupRecipientLabel(
  task: Pick<UserTask, "assignment_type" | "targetCompany" | "targetDepartment" | "targetUsers">,
): string {
  const type: TaskAssignmentType | null | undefined = task.assignment_type;
  if (type === "company") return task.targetCompany?.name ? `Компания «${task.targetCompany.name}»` : "Компания";
  if (type === "department") {
    const name = task.targetDepartment?.name;
    const company = task.targetDepartment?.company?.name;
    if (!name) return "Отдел";
    return company ? `Отдел «${name}» · ${company}` : `Отдел «${name}»`;
  }
  if (type === "users") {
    const users = task.targetUsers ?? [];
    if (users.length === 0) return "Сотрудники";
    return users.map((u) => u.full_name).join(", ");
  }
  return "";
}

function extractError(error: unknown): string {
  const data = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
  return data?.message || data?.error || "Ошибка запроса";
}

export async function getTaskRecipients(): Promise<
  { ok: true; data: RecipientDirectory } | { ok: false; error: string }
> {
  try {
    const res = await api.get<RawDirectory>("/user-tasks/recipients");
    const raw = res.data;
    return {
      ok: true,
      data: {
        my_company: raw.my_company ? { ...raw.my_company, whole: true } : null,
        available_companies: raw.available_companies ?? [],
      },
    };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export interface TaskParticipant {
  id: number;
  full_name: string;
  position: string | null;
  department_id: number | null;
}

export async function getTaskParticipants(
  taskId: number,
  q?: string,
): Promise<{ ok: true; data: TaskParticipant[] } | { ok: false; error: string }> {
  try {
    const res = await api.get<{ participants: TaskParticipant[] }>(`/user-tasks/${taskId}/participants`, {
      params: q && q.trim() ? { q: q.trim() } : undefined,
    });
    return { ok: true, data: res.data.participants ?? [] };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

/** user_id: null — снять ответственного. */
export async function setTaskResponsible(
  taskId: number,
  userId: number | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.put(`/user-tasks/${taskId}/responsible`, { user_id: userId });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function getTaskHistory(
  taskId: number,
): Promise<{ ok: true; data: TaskEvent[] } | { ok: false; error: string }> {
  try {
    const res = await api.get<{ events: TaskEvent[] }>(`/user-tasks/${taskId}/history`);
    return { ok: true, data: res.data.events ?? [] };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}
