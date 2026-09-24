import type { OrgStructureLogItem } from "@/lib/org-structure-api";
import type { InteractionGroupLogItem } from "@/lib/task-interaction-groups-api";

type Obj = Record<string, unknown> | null | undefined;

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function personName(v: Obj): string | null {
  if (!v || typeof v !== "object") return null;
  return str((v as Record<string, unknown>).full_name);
}

function deptName(v: Obj): string {
  const dept = v && typeof v === "object" ? (v as Record<string, unknown>).department : null;
  if (dept && typeof dept === "object") {
    return `«${str((dept as Record<string, unknown>).name) ?? "—"}»`;
  }
  return "«Без отдела»";
}

function nameOf(v: Obj): string {
  return str(v?.name as unknown) ?? "—";
}

const REASON_TEXT: Record<string, string> = {
  employee_removed: "сотрудник удалён из компании",
  department_deactivated: "отдел деактивирован",
};

function reasonSuffix(v: Obj): string {
  const reason = str(v?.reason as unknown);
  return reason && REASON_TEXT[reason] ? ` (${REASON_TEXT[reason]})` : "";
}

/** Человекочитаемое описание события журнала оргструктуры. */
export function describeOrgLog(log: OrgStructureLogItem): string {
  const entity = log.entity_name ?? "—";
  const who = log.targetUser?.full_name ?? entity;
  switch (log.action) {
    case "company_created":
      return `Создана компания «${entity}»`;
    case "company_renamed":
      return `Компания переименована: «${nameOf(log.old_value)}» → «${nameOf(log.new_value)}»`;
    case "company_deactivated":
      return `Компания «${entity}» деактивирована`;
    case "company_activated":
      return `Компания «${entity}» активирована`;
    case "company_head_changed":
      return `Руководитель компании: ${personName(log.old_value) ?? "не назначен"} → ${
        personName(log.new_value) ?? "не назначен"
      }${reasonSuffix(log.new_value)}`;
    case "department_created":
      return `Создан отдел «${entity}»`;
    case "department_renamed":
      return `Отдел переименован: «${nameOf(log.old_value)}» → «${nameOf(log.new_value)}»`;
    case "department_deactivated":
      return `Отдел «${entity}» деактивирован`;
    case "department_activated":
      return `Отдел «${entity}» активирован`;
    case "department_head_changed":
      return `Руководитель отдела «${entity}»: ${personName(log.old_value) ?? "не назначен"} → ${
        personName(log.new_value) ?? "не назначен"
      }${reasonSuffix(log.new_value)}`;
    case "employee_added":
      return `${who} добавлен(а) в компанию, отдел ${deptName(log.new_value)}`;
    case "employee_department_changed":
      return `${who}: отдел ${deptName(log.old_value)} → ${deptName(log.new_value)}`;
    case "employee_moved_to_no_department":
      return `${who} переведён(а) в «Без отдела» из ${deptName(log.old_value)}${reasonSuffix(log.new_value)}`;
    case "employee_removed":
      return `${who} удалён(а) из компании`;
    default:
      return log.action;
  }
}

const MODE_TEXT: Record<string, string> = {
  all: "«Все участники»",
  selected: "«Только выбранные сотрудники»",
};

function memberText(d: Obj): string {
  if (!d) return "—";
  const label = str(d.label as unknown) ?? "—";
  const company = str(d.company as unknown);
  if (d.type === "company") return `компания «${label}»`;
  if (d.type === "department") return `отдел «${label}»${company ? ` (${company})` : ""}`;
  return `сотрудник ${label}${company ? ` (${company})` : ""}`;
}

/** Человекочитаемое описание события журнала группы взаимодействия. */
export function describeGroupLog(log: InteractionGroupLogItem): string {
  const d = (log.details && typeof log.details === "object" ? log.details : null) as Obj;
  switch (log.action) {
    case "group_created":
      return `Группа создана${str(d?.name as unknown) ? ` «${d?.name}»` : ""}, режим ${
        MODE_TEXT[String(d?.creators_mode)] ?? "—"
      }`;
    case "group_renamed":
      return `Название: «${str(d?.old as unknown) ?? "без названия"}» → «${str(d?.new as unknown) ?? "без названия"}»`;
    case "member_added":
      return `Добавлен участник: ${memberText(d)}`;
    case "member_removed":
      return `Удалён участник: ${memberText(d)}`;
    case "creators_mode_changed":
      return `Режим постановщиков: ${MODE_TEXT[String(d?.old)] ?? "—"} → ${MODE_TEXT[String(d?.new)] ?? "—"}`;
    case "creator_added":
      return `Добавлен постановщик: ${personName(d) ?? "—"}`;
    case "creator_removed":
      return `Убран постановщик: ${personName(d) ?? "—"}`;
    case "group_activated":
      return "Группа активирована";
    case "group_deactivated":
      return "Группа деактивирована";
    default:
      return log.action;
  }
}
