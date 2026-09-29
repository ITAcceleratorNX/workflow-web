import type { GroupTaskFields } from "@/lib/user-tasks-api";
import { confirmAction, showNotice } from "@/stores/confirm-dialog-store";

type ToggleSource = GroupTaskFields & { completed: boolean };

export function isGroupTask(task: GroupTaskFields | null | undefined): boolean {
  return Boolean(task?.assignment_type);
}

/** Задача передана и осталась у пользователя только для просмотра. */
export function isReadOnlyTask(task: Pick<GroupTaskFields, "task_permissions"> | null | undefined): boolean {
  return task?.task_permissions?.read_only === true;
}

/** Почему текущий пользователь не может переключить статус задачи (null — может). */
export function taskToggleBlockedReason(task: ToggleSource): string | null {
  if (isReadOnlyTask(task)) {
    return "Задача передана другому получателю. Вы можете её просматривать, но не менять статус.";
  }
  if (!isGroupTask(task) || !task.group_permissions) return null;
  if (task.completed) {
    return task.group_permissions.can_reopen
      ? null
      : "Вернуть задачу в работу может автор или ответственный, который её завершил.";
  }
  if (task.group_permissions.can_complete) return null;
  if (task.responsible?.full_name) {
    return `Завершить задачу может только ответственный: ${task.responsible.full_name}.`;
  }
  return "Завершить групповую задачу может только её участник.";
}

/**
 * Перед переключением галочки: объяснить запрет (задача только для просмотра, правило групповой
 * задачи) или подтвердить завершение групповой задачи для всех участников. «Отмена» не меняет
 * статус ни у кого. Для обычной задачи с правами сразу true.
 */
export async function confirmTaskToggle(task: ToggleSource): Promise<boolean> {
  const blocked = taskToggleBlockedReason(task);
  if (blocked) {
    await showNotice(isGroupTask(task) ? "Групповая задача" : "Только просмотр", blocked);
    return false;
  }
  if (!isGroupTask(task) || task.completed) return true;
  return confirmAction({
    title: "Групповая задача",
    message: "Завершить задачу для всех участников?",
    confirmLabel: "Завершить",
  });
}

/** «Передать задачу: Отдел Финансы?» — «Отмена» не меняет ни получателя, ни задачу. */
export function confirmTaskTransfer(recipientLabel: string): Promise<boolean> {
  return confirmAction({
    title: "Передача задачи",
    message: `Передать задачу: ${recipientLabel}?`,
    confirmLabel: "Передать",
  });
}

/** Подтверждение массового назначения компании / отдела перед созданием задачи. */
export function confirmMassAssignment(message: string | null): Promise<boolean> {
  if (!message) return Promise.resolve(true);
  return confirmAction({ title: "Назначение", message, confirmLabel: "Продолжить" });
}
