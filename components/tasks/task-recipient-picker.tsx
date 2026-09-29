"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDot,
  Landmark,
  Loader2,
  Search,
  Square,
  SquareCheck,
  User,
  X,
} from "lucide-react";

import { TaskExecutorPickerOverlay } from "@/components/tasks/task-assignment-pickers";
import { TaskPickerShell, type TaskPickerVariant } from "@/components/tasks/task-picker-shell";
import { useTaskPickerTheme } from "@/hooks/use-task-picker-theme";
import { useTaskRecipients } from "@/hooks/use-task-recipients";
import { employeeSubtitle, matchesEveryWord } from "@/lib/employee-display";
import {
  recipientSelectionLabel,
  type RecipientCompany,
  type RecipientDepartment,
  type RecipientEmployee,
  type RecipientSelection,
} from "@/lib/task-recipients-api";
import { showNotice } from "@/stores/confirm-dialog-store";
import { cn } from "@/lib/utils";

const SEARCH_EMPLOYEES_LIMIT = 50;

type Props = {
  visible: boolean;
  onClose: () => void;
  currentUserId: number | null;
  value: RecipientSelection | null;
  onConfirm: (selection: RecipientSelection | null) => void;
  /** Заголовок: «Исполнитель» при создании, «Передать задачу» при передаче. */
  title?: string;
  variant?: TaskPickerVariant;
};

type Entry = { company: RecipientCompany; mine: boolean };

function companyRef(c: RecipientCompany) {
  return { id: c.id, name: c.name };
}

/**
 * Выбор получателя задачи: «Моя компания» и «Доступные компании» (только то, что открыто
 * группами взаимодействия). Один тип назначения: компания, отдел или сотрудники одной компании.
 * Содержимое монтируется при каждом открытии: черновик выбора и справочник — с нуля.
 */
export function TaskRecipientPicker(props: Props) {
  if (!props.visible) return null;
  return <RecipientPicker {...props} />;
}

function RecipientPicker({
  onClose,
  currentUserId,
  value,
  onConfirm,
  title = "Исполнитель",
  variant = "sheet",
}: Props) {
  const { text, textMuted, primary, border, cardBg } = useTaskPickerTheme(variant);
  const isDialog = variant === "dialog";
  const { directory, loading, error, reload } = useTaskRecipients();
  const [draft, setDraft] = useState<RecipientSelection | null>(value);
  const [query, setQuery] = useState("");
  const [openCompanyId, setOpenCompanyId] = useState<number | null>(null);

  const entries = useMemo<Entry[]>(() => {
    if (!directory) return [];
    const list: Entry[] = [];
    if (directory.my_company) list.push({ company: directory.my_company, mine: true });
    for (const c of directory.available_companies) list.push({ company: c, mine: false });
    return list;
  }, [directory]);
  const openEntry = entries.find((e) => e.company.id === openCompanyId) ?? null;

  const selectCompany = (company: RecipientCompany) =>
    setDraft((prev) =>
      prev?.type === "company" && prev.company.id === company.id ? null : { type: "company", company: companyRef(company) },
    );

  const selectDepartment = (company: RecipientCompany, department: RecipientDepartment) =>
    setDraft((prev) =>
      prev?.type === "department" && prev.department.id === department.id
        ? null
        : { type: "department", company: companyRef(company), department },
    );

  const toggleUser = (company: RecipientCompany, user: RecipientEmployee) => {
    if (draft?.type === "users" && draft.company.id !== company.id) {
      void showNotice(
        "Одна компания",
        `Можно выбрать сотрудников только одной компании. Уже выбраны сотрудники «${draft.company.name}».`,
      );
      return;
    }
    const person = { id: user.id, full_name: user.full_name };
    if (draft?.type !== "users") {
      setDraft({ type: "users", company: companyRef(company), users: [person] });
      return;
    }
    const has = draft.users.some((u) => u.id === user.id);
    const users = has ? draft.users.filter((u) => u.id !== user.id) : [...draft.users, person];
    setDraft(users.length ? { ...draft, users } : null);
  };

  const isCompanySelected = (id: number) => draft?.type === "company" && draft.company.id === id;
  const isDepartmentSelected = (id: number) => draft?.type === "department" && draft.department.id === id;
  const isUserSelected = (id: number) => draft?.type === "users" && draft.users.some((u) => u.id === id);

  // Сотрудник без компании в оргструктуре: прежний поиск исполнителя.
  if (directory && !directory.my_company) {
    return (
      <TaskExecutorPickerOverlay
        visible
        onClose={onClose}
        teamScope={false}
        team={null}
        selectedExecutor={value?.type === "legacy_user" ? value.user : null}
        onSelect={(user) => onConfirm(user ? { type: "legacy_user", user } : null)}
        variant={variant}
      />
    );
  }

  const rowClass = cn(
    "w-full flex items-center gap-3 min-h-12 text-left transition-colors",
    isDialog ? "rounded-xl px-3 py-2.5 hover:bg-[#2C2C2E]" : "py-3 border-b",
  );
  const rowStyle = isDialog ? undefined : { borderColor: border };

  const labelBlock = (label: string, subtitle: string | null) => (
    <span className="flex-1 min-w-0">
      <span className="block text-[15px] line-clamp-2" style={{ color: text }}>
        {label}
      </span>
      {subtitle ? (
        <span className="block text-xs truncate mt-0.5" style={{ color: textMuted }}>
          {subtitle}
        </span>
      ) : null}
    </span>
  );

  const radioRow = (key: string, label: string, subtitle: string | null, on: boolean, onPress: () => void, icon: ReactNode) => (
    <button key={key} type="button" role="radio" aria-checked={on} className={rowClass} style={rowStyle} onClick={onPress}>
      {icon}
      {labelBlock(label, subtitle)}
      {on ? (
        <CircleDot className="h-5 w-5 shrink-0" style={{ color: primary }} />
      ) : (
        <Circle className="h-5 w-5 shrink-0" style={{ color: textMuted }} />
      )}
    </button>
  );

  const companyIcon = <Building2 className="h-5 w-5 shrink-0" style={{ color: primary }} />;
  const departmentIcon = <Landmark className="h-5 w-5 shrink-0" style={{ color: primary }} />;

  const userRow = (company: RecipientCompany, user: RecipientEmployee, subtitle: string | null) => {
    const on = isUserSelected(user.id);
    return (
      <button
        key={`u-${company.id}-${user.id}`}
        type="button"
        role="checkbox"
        aria-checked={on}
        className={rowClass}
        style={rowStyle}
        onClick={() => toggleUser(company, user)}
      >
        {on ? (
          <SquareCheck className="h-5 w-5 shrink-0" style={{ color: primary }} />
        ) : (
          <Square className="h-5 w-5 shrink-0" style={{ color: textMuted }} />
        )}
        {labelBlock(user.full_name, subtitle)}
      </button>
    );
  };

  const companyLink = ({ company, mine }: Entry) => {
    const parts: string[] = [];
    if (company.whole) parts.push(mine ? "Своя компания" : "Вся компания");
    if (company.departments.length) parts.push(`отделов: ${company.departments.length}`);
    const people = company.employees.filter((e) => e.id !== currentUserId).length;
    if (people) parts.push(`сотрудников: ${people}`);
    const hasSelection = draft != null && draft.type !== "legacy_user" && draft.company.id === company.id;
    return (
      <button
        key={`c-${company.id}`}
        type="button"
        className={rowClass}
        style={rowStyle}
        onClick={() => {
          setQuery("");
          setOpenCompanyId(company.id);
        }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${primary}22` }}>
          <Building2 className="h-5 w-5" style={{ color: primary }} />
        </span>
        {labelBlock(company.name, parts.join(" · "))}
        {hasSelection ? <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: primary }} /> : null}
        <ChevronRight className="h-5 w-5 shrink-0" style={{ color: textMuted }} />
      </button>
    );
  };

  const sectionTitle = (label: string) => (
    <p key={`h-${label}`} className="mt-4 mb-1 px-1 text-xs font-semibold uppercase tracking-wide" style={{ color: textMuted }}>
      {label}
    </p>
  );

  const hint = (key: string, textValue: string) => (
    <p key={key} className="px-1 py-3 text-sm" style={{ color: textMuted }}>
      {textValue}
    </p>
  );

  const renderCompany = ({ company, mine }: Entry) => {
    const deptName = new Map(company.departments.map((dp) => [dp.id, dp.name]));
    const people = company.employees.filter((e) => e.id !== currentUserId);
    const groups: { title: string; list: RecipientEmployee[] }[] = company.departments.map((dp) => ({
      title: dp.name,
      list: people.filter((e) => e.department_id === dp.id),
    }));
    const noDept = people.filter((e) => e.department_id == null);
    const other = people.filter((e) => e.department_id != null && !deptName.has(e.department_id));
    if (noDept.length) groups.push({ title: "Без отдела", list: noDept });
    if (other.length) groups.push({ title: "Другие сотрудники", list: other });
    const countIn = (id: number) => company.employees.filter((e) => e.department_id === id).length;

    const out: ReactNode[] = [
      <button
        key="back"
        type="button"
        className="flex items-center gap-2 py-3 text-sm font-semibold"
        style={{ color: primary }}
        onClick={() => setOpenCompanyId(null)}
      >
        <ArrowLeft className="h-4 w-4" />
        {mine ? "Моя компания" : "Доступные компании"}
      </button>,
      <p key="title" className="px-1 pb-1 text-lg font-bold" style={{ color: text }}>
        {company.name}
      </p>,
    ];
    if (company.whole) {
      out.push(
        radioRow(
          `c-${company.id}`,
          "Вся компания",
          `Назначить всем сотрудникам (${company.employees.length})`,
          isCompanySelected(company.id),
          () => selectCompany(company),
          companyIcon,
        ),
      );
    }
    if (company.departments.length) {
      out.push(sectionTitle("Отделы"));
      for (const dp of company.departments) {
        out.push(
          radioRow(
            `d-${dp.id}`,
            dp.name,
            `Весь отдел · сотрудников: ${countIn(dp.id)}`,
            isDepartmentSelected(dp.id),
            () => selectDepartment(company, dp),
            departmentIcon,
          ),
        );
      }
    }
    const nonEmpty = groups.filter((g) => g.list.length);
    if (nonEmpty.length) {
      out.push(sectionTitle("Сотрудники"));
      for (const g of nonEmpty) {
        out.push(
          <p key={`g-${g.title}`} className="mt-2 px-1 text-xs font-medium" style={{ color: textMuted }}>
            {g.title}
          </p>,
        );
        for (const e of g.list) out.push(userRow(company, e, e.position));
      }
    }
    return out;
  };

  const renderSearch = () => {
    const out: ReactNode[] = [];
    for (const e of entries.filter((x) => matchesEveryWord(query, [x.company.name]))) {
      out.push(
        e.company.whole
          ? radioRow(
              `sc-${e.company.id}`,
              e.company.name,
              e.mine ? "Моя компания · вся компания" : "Вся компания",
              isCompanySelected(e.company.id),
              () => selectCompany(e.company),
              companyIcon,
            )
          : companyLink(e),
      );
    }
    for (const e of entries) {
      for (const dp of e.company.departments) {
        if (!matchesEveryWord(query, [dp.name])) continue;
        out.push(
          radioRow(
            `sd-${dp.id}`,
            dp.name,
            `Отдел · ${e.company.name}`,
            isDepartmentSelected(dp.id),
            () => selectDepartment(e.company, dp),
            departmentIcon,
          ),
        );
      }
    }
    // Сотрудник находится по ФИО или должности — только среди уже доступных получателей.
    let shown = 0;
    for (const e of entries) {
      const deptName = new Map(e.company.departments.map((dp) => [dp.id, dp.name]));
      for (const u of e.company.employees) {
        if (u.id === currentUserId || shown >= SEARCH_EMPLOYEES_LIMIT) continue;
        if (!matchesEveryWord(query, [u.full_name, u.position])) continue;
        shown += 1;
        const dept = u.department_id == null ? "Без отдела" : deptName.get(u.department_id);
        const company = e.mine ? null : e.company.name;
        out.push(userRow(e.company, u, employeeSubtitle([company, dept, u.position])));
      }
    }
    if (!out.length) out.push(hint("empty", "Ничего не найдено среди доступных получателей"));
    return out;
  };

  const renderRoot = () => {
    const mine = entries.find((e) => e.mine);
    const external = entries.filter((e) => !e.mine);
    return [
      sectionTitle("Моя компания"),
      mine ? companyLink(mine) : null,
      sectionTitle("Доступные компании"),
      ...(external.length
        ? external.map(companyLink)
        : [hint("no-ext", "Нет доступных компаний. Доступ к другим компаниям настраивает Администратор.")]),
    ];
  };

  let body: ReactNode;
  if (!directory && loading) {
    body = (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primary }} />
      </div>
    );
  } else if (!directory && error) {
    body = (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm" style={{ color: textMuted }}>
          {error}
        </p>
        <button type="button" className="font-semibold" style={{ color: primary }} onClick={reload}>
          Повторить
        </button>
      </div>
    );
  } else if (query.trim()) {
    body = renderSearch();
  } else if (openEntry) {
    body = renderCompany(openEntry);
  } else {
    body = renderRoot();
  }

  const selectionText =
    draft?.type === "company"
      ? `Вся компания «${draft.company.name}»`
      : draft?.type === "department"
        ? `Весь отдел «${draft.department.name}» · ${draft.company.name}`
        : draft?.type === "users"
          ? `Сотрудники (${draft.users.length}): ${recipientSelectionLabel(draft)}`
          : draft
            ? recipientSelectionLabel(draft)
            : "";

  return (
    <TaskPickerShell open onClose={onClose} variant={variant} title={isDialog ? title : undefined} maxWidthClass="max-w-lg">
      <div className="flex min-h-0 flex-col">
        {!isDialog ? (
          <div className="flex shrink-0 items-center justify-between px-2 py-1">
            <button type="button" onClick={onClose} className="p-2 min-h-11 min-w-11" aria-label="Закрыть">
              <X className="h-6 w-6" style={{ color: text }} />
            </button>
            <span className="text-lg font-semibold" style={{ color: text }}>
              {title}
            </span>
            <button type="button" onClick={() => onConfirm(draft)} className="p-2 min-h-11 min-w-11" aria-label="Готово">
              <Check className="h-6 w-6" style={{ color: primary }} />
            </button>
          </div>
        ) : null}

        <div className={cn("shrink-0 space-y-2", isDialog ? "px-6 pt-4" : "px-4")}>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ backgroundColor: cardBg, borderColor: border }}>
            <Search className="h-5 w-5 shrink-0" style={{ color: textMuted }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Компания, отдел, ФИО или должность"
              className="min-h-9 flex-1 bg-transparent text-base outline-none"
              style={{ color: text }}
              autoFocus
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Очистить поиск">
                <X className="h-4 w-4" style={{ color: textMuted }} />
              </button>
            ) : null}
          </div>
          {draft ? (
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: primary, backgroundColor: `${primary}14` }}>
              {draft.type === "company" ? (
                <Building2 className="h-4 w-4 shrink-0" style={{ color: primary }} />
              ) : draft.type === "department" ? (
                <Landmark className="h-4 w-4 shrink-0" style={{ color: primary }} />
              ) : (
                <User className="h-4 w-4 shrink-0" style={{ color: primary }} />
              )}
              <span className="flex-1 text-sm font-semibold line-clamp-2" style={{ color: text }}>
                {selectionText}
              </span>
              <button type="button" onClick={() => setDraft(null)} aria-label="Сбросить выбор">
                <X className="h-4 w-4" style={{ color: primary }} />
              </button>
            </div>
          ) : null}
        </div>

        <div className={cn("min-h-0 overflow-y-auto", isDialog ? "px-5 pb-2 max-h-[min(55vh,520px)]" : "px-4 pb-6 max-h-[55vh]")}>
          {body}
        </div>

        {isDialog ? (
          <div className="flex shrink-0 justify-end gap-2 border-t border-[#3A3A3C] px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#8E8E93] hover:text-white">
              Отмена
            </button>
            <button
              type="button"
              onClick={() => onConfirm(draft)}
              className="rounded-xl bg-[#E25B21] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c94f1c]"
            >
              Готово
            </button>
          </div>
        ) : null}
      </div>
    </TaskPickerShell>
  );
}
