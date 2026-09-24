"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Building2,
  Crown,
  FolderMinus,
  FolderOpen,
  History,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManagementModalShell } from "@/components/layout/management-modal-shell";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  addOrgEmployee,
  changeOrgEmployeeDepartment,
  createOrgDepartment,
  listOrgCompanyLogs,
  listOrgEmployees,
  NO_DEPARTMENT,
  removeOrgEmployee,
  searchOrgCandidates,
  setOrgCompanyActive,
  setOrgDepartmentActive,
  updateOrgCompany,
  updateOrgDepartment,
  type ApiResult,
  type DepartmentFilter,
  type OrgCandidate,
  type OrgCompanyDetails,
  type OrgDepartment,
  type OrgEmployee,
  type OrgUserBrief,
} from "@/lib/org-structure-api";
import { describeOrgLog } from "@/lib/org-structure-log-format";
import { ConfirmDialog, LogDialog, NameDialog } from "./org-dialogs";
import { DARK_OUTLINE_BUTTON_CLASS, EmptyState, StatusBadge, Tag } from "./org-ui";
import { PersonOption, SearchPicker, SelectedChip } from "./search-picker";

type DeptSelection = "all" | typeof NO_DEPARTMENT | number;

type Confirm = {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  run: () => Promise<ApiResult<OrgCompanyDetails>>;
  success: string;
};

/** Внутренняя структура компании: отделы, «Без отдела», сотрудники, руководители, журнал. */
export function StructureCompanyScreen({
  company,
  onCompanyChange,
}: {
  company: OrgCompanyDetails;
  onCompanyChange: (company: OrgCompanyDetails) => void;
}) {
  const { toast } = useToast();
  const [selection, setSelection] = useState<DeptSelection>("all");
  const [deptQuery, setDeptQuery] = useState("");
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [renameCompanyOpen, setRenameCompanyOpen] = useState(false);
  const [companyHeadOpen, setCompanyHeadOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [createDeptOpen, setCreateDeptOpen] = useState(false);
  const [renameDept, setRenameDept] = useState<OrgDepartment | null>(null);
  const [deptHead, setDeptHead] = useState<OrgDepartment | null>(null);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [moveEmployee, setMoveEmployee] = useState<OrgEmployee | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const activeDepartments = useMemo(
    () => company.departments.filter((d) => d.is_active),
    [company.departments],
  );
  const inactiveDepartments = useMemo(
    () => company.departments.filter((d) => !d.is_active),
    [company.departments],
  );
  const selectedDept =
    typeof selection === "number" ? company.departments.find((d) => d.id === selection) ?? null : null;

  // Отдел мог исчезнуть из выборки — возвращаемся к «Все сотрудники»
  useEffect(() => {
    if (typeof selection === "number" && !selectedDept) setSelection("all");
  }, [selection, selectedDept]);

  const refresh = useCallback(
    (next: OrgCompanyDetails) => {
      onCompanyChange(next);
      setReloadKey((k) => k + 1);
    },
    [onCompanyChange],
  );

  const apply = useCallback(
    async (promise: Promise<ApiResult<OrgCompanyDetails>>, success: string): Promise<string | null> => {
      const res = await promise;
      if (!res.ok) {
        toast({ title: res.error, variant: "destructive" });
        return res.error;
      }
      refresh(res.data);
      toast({ title: success });
      return null;
    },
    [refresh, toast],
  );

  useEffect(() => {
    let cancelled = false;
    const department: DepartmentFilter = selection === "all" ? null : selection;
    const timer = window.setTimeout(
      () => {
        setEmployeesLoading(true);
        void listOrgEmployees(company.id, { department, q: employeeQuery.trim() }).then((res) => {
          if (cancelled) return;
          setEmployeesLoading(false);
          if (res.ok) setEmployees(res.data);
          else toast({ title: res.error, variant: "destructive" });
        });
      },
      employeeQuery ? 250 : 0,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [company.id, selection, employeeQuery, reloadKey, toast]);

  const searchCompanyEmployees = useCallback(
    async (q: string): Promise<OrgEmployee[]> => {
      const res = await listOrgEmployees(company.id, { q });
      return res.ok ? res.data : [];
    },
    [company.id],
  );

  const fetchLogs = useCallback(
    (page: number) => listOrgCompanyLogs(company.id, { page, limit: 30 }),
    [company.id],
  );

  const deptFilter = deptQuery.trim().toLowerCase();
  const visibleActive = activeDepartments.filter((d) => d.name.toLowerCase().includes(deptFilter));
  const visibleInactive = inactiveDepartments.filter((d) => d.name.toLowerCase().includes(deptFilter));

  const listTitle =
    selection === "all" ? "Все сотрудники" : selection === NO_DEPARTMENT ? "Без отдела" : selectedDept?.name ?? "";

  return (
    <div className="space-y-5 pb-6">
      {/* Карточка компании */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(243,87,19,0.2)]">
            <Building2 className="h-6 w-6 text-[#F35713]" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-foreground">{company.name}</h2>
              <StatusBadge active={company.is_active} />
            </div>
            <p className="text-sm text-muted-foreground">
              Офис: {company.office?.name ?? `#${company.office_id}`} · Сотрудников: {company.employees_count} ·
              Активных отделов: {activeDepartments.length}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Руководитель:</span>
              <span className="font-medium text-foreground">{company.head?.full_name ?? "не назначен"}</span>
              <button
                type="button"
                onClick={() => setCompanyHeadOpen(true)}
                className="text-[#F35713] hover:underline"
              >
                {company.head ? "Изменить" : "Назначить"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className={DARK_OUTLINE_BUTTON_CLASS} onClick={() => setLogOpen(true)}>
            <History className="h-4 w-4" />
            Журнал изменений
          </Button>
          <Button variant="outline" className={DARK_OUTLINE_BUTTON_CLASS} onClick={() => setRenameCompanyOpen(true)}>
            <Pencil className="h-4 w-4" />
            Переименовать
          </Button>
          <Button variant="outline" className={DARK_OUTLINE_BUTTON_CLASS}
            onClick={() =>
              setConfirm(
                company.is_active
                  ? {
                      title: "Деактивировать компанию?",
                      description:
                        "Компания исчезнет из активных списков и не будет использоваться в новых операциях. Сотрудники, их аккаунты и история сохранятся.",
                      confirmLabel: "Деактивировать",
                      destructive: true,
                      run: () => setOrgCompanyActive(company.id, false),
                      success: "Компания деактивирована",
                    }
                  : {
                      title: "Активировать компанию?",
                      description: "Компания снова станет доступной в активных списках.",
                      confirmLabel: "Активировать",
                      run: () => setOrgCompanyActive(company.id, true),
                      success: "Компания активирована",
                    },
              )
            }
          >
            <Power className="h-4 w-4" />
            {company.is_active ? "Деактивировать" : "Активировать"}
          </Button>
        </div>
      </div>

      {!company.is_active ? (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Компания деактивирована: добавление сотрудников и создание отделов недоступны до повторной активации.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Отделы */}
        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Отделы</h3>
            <Button size="sm" variant="outline" className={DARK_OUTLINE_BUTTON_CLASS} onClick={() => setCreateDeptOpen(true)} disabled={!company.is_active}>
              <Plus className="h-4 w-4" />
              Отдел
            </Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={deptQuery}
              onChange={(e) => setDeptQuery(e.target.value)}
              placeholder="Поиск отдела"
              className="pl-9"
            />
          </div>
          <div className="space-y-1">
            <DeptItem
              icon={<Users className="h-4 w-4" />}
              label="Все сотрудники"
              count={company.employees_count}
              selected={selection === "all"}
              onClick={() => setSelection("all")}
            />
            <DeptItem
              icon={<FolderMinus className="h-4 w-4" />}
              label="Без отдела"
              hint="Системная группа"
              count={company.no_department_count}
              selected={selection === NO_DEPARTMENT}
              onClick={() => setSelection(NO_DEPARTMENT)}
            />
            <div className="my-2 border-t border-border" />
            {visibleActive.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {deptFilter ? "Отделы не найдены" : "Отделов пока нет"}
              </p>
            ) : (
              visibleActive.map((d) => (
                <DeptItem
                  key={d.id}
                  icon={<FolderOpen className="h-4 w-4" />}
                  label={d.name}
                  hint={d.head ? `Рук.: ${d.head.full_name}` : undefined}
                  count={d.employees_count}
                  selected={selection === d.id}
                  onClick={() => setSelection(d.id)}
                />
              ))
            )}
            {visibleInactive.length > 0 ? (
              <>
                <p className="px-3 pb-1 pt-3 text-xs uppercase tracking-wide text-muted-foreground">Неактивные</p>
                {visibleInactive.map((d) => (
                  <DeptItem
                    key={d.id}
                    icon={<FolderOpen className="h-4 w-4" />}
                    label={d.name}
                    count={d.employees_count}
                    inactive
                    selected={selection === d.id}
                    onClick={() => setSelection(d.id)}
                  />
                ))}
              </>
            ) : null}
          </div>
        </aside>

        {/* Сотрудники выбранной группы */}
        <section className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-foreground">{listTitle}</h3>
                {selectedDept ? <StatusBadge active={selectedDept.is_active} /> : null}
                {selection === NO_DEPARTMENT ? <Tag>Системная группа</Tag> : null}
              </div>
              {selectedDept ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Руководитель отдела:</span>
                  <span className="text-foreground">{selectedDept.head?.full_name ?? "не назначен"}</span>
                  <button
                    type="button"
                    onClick={() => setDeptHead(selectedDept)}
                    className="text-[#F35713] hover:underline"
                  >
                    {selectedDept.head ? "Изменить" : "Назначить"}
                  </button>
                </div>
              ) : selection === NO_DEPARTMENT ? (
                <p className="text-sm text-muted-foreground">
                  Сотрудники без назначенного отдела и из деактивированных отделов.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDept ? (
                <>
                  <Button size="sm" variant="outline" className={DARK_OUTLINE_BUTTON_CLASS} onClick={() => setRenameDept(selectedDept)}>
                    <Pencil className="h-4 w-4" />
                    Переименовать
                  </Button>
                  <Button
                    size="sm" variant="outline" className={DARK_OUTLINE_BUTTON_CLASS}
                    onClick={() =>
                      setConfirm(
                        selectedDept.is_active
                          ? {
                              title: `Деактивировать отдел «${selectedDept.name}»?`,
                              description: `Все сотрудники отдела (${selectedDept.employees_count}) автоматически перейдут в «Без отдела». История отдела сохранится.`,
                              confirmLabel: "Деактивировать",
                              destructive: true,
                              run: () => setOrgDepartmentActive(selectedDept.id, false),
                              success: "Отдел деактивирован",
                            }
                          : {
                              title: `Активировать отдел «${selectedDept.name}»?`,
                              description:
                                "Отдел вернётся в список активных. Прежние сотрудники обратно автоматически не распределяются.",
                              confirmLabel: "Активировать",
                              run: () => setOrgDepartmentActive(selectedDept.id, true),
                              success: "Отдел активирован",
                            },
                      )
                    }
                  >
                    <Power className="h-4 w-4" />
                    {selectedDept.is_active ? "Деактивировать" : "Активировать"}
                  </Button>
                </>
              ) : null}
              <Button size="sm" onClick={() => setAddEmployeeOpen(true)} disabled={!company.is_active}>
                <UserPlus className="h-4 w-4" />
                Добавить сотрудника
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={employeeQuery}
              onChange={(e) => setEmployeeQuery(e.target.value)}
              placeholder="Поиск сотрудника по имени или телефону"
              className="pl-9"
            />
          </div>

          {employeesLoading && employees.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-[#F35713]" />
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8 text-muted-foreground" />}
              title={employeeQuery ? "Никого не найдено" : "Сотрудников нет"}
              text={
                employeeQuery
                  ? undefined
                  : "Добавьте зарегистрированного пользователя Workflow через поиск."
              }
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              {employees.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-foreground">
                    {e.full_name.trim().charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-foreground">{e.full_name}</p>
                      {e.is_company_head ? (
                        <Tag tone="accent">
                          <Crown className="mr-1 h-3 w-3" />
                          Руководитель компании
                        </Tag>
                      ) : null}
                      {e.head_of_departments.map((d) => (
                        <Tag key={d.id} tone="accent">
                          <Crown className="mr-1 h-3 w-3" />
                          Рук. отдела «{d.name}»
                        </Tag>
                      ))}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {[e.position, e.phone, selection === "all" ? e.department?.name ?? "Без отдела" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <IconAction
                      label="Перевести в другой отдел"
                      onClick={() => setMoveEmployee(e)}
                      disabled={!company.is_active}
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </IconAction>
                    {e.department_id != null ? (
                      <IconAction
                        label="Убрать из отдела"
                        onClick={() =>
                          setConfirm({
                            title: "Убрать из отдела?",
                            description: `${e.full_name} перейдёт в «Без отдела».`,
                            confirmLabel: "Убрать из отдела",
                            run: () => changeOrgEmployeeDepartment(company.id, e.id, null),
                            success: "Сотрудник переведён в «Без отдела»",
                          })
                        }
                      >
                        <FolderMinus className="h-4 w-4" />
                      </IconAction>
                    ) : null}
                    <IconAction
                      label="Убрать из компании"
                      destructive
                      onClick={() =>
                        setConfirm({
                          title: "Убрать сотрудника из компании?",
                          description: `${e.full_name} будет удалён(а) из компании «${company.name}»${
                            e.is_company_head || e.head_of_departments.length ? " и снят(а) с метки руководителя" : ""
                          }. Аккаунт Workflow останется активным.`,
                          confirmLabel: "Убрать из компании",
                          destructive: true,
                          run: () => removeOrgEmployee(company.id, e.id),
                          success: "Сотрудник убран из компании",
                        })
                      }
                    >
                      <UserMinus className="h-4 w-4" />
                    </IconAction>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Модалки */}
      <NameDialog
        open={renameCompanyOpen}
        title="Переименовать компанию"
        label="Название компании"
        initial={company.name}
        onClose={() => setRenameCompanyOpen(false)}
        onSubmit={async (name) => {
          const err = await apply(updateOrgCompany(company.id, { name }), "Компания переименована");
          if (!err) setRenameCompanyOpen(false);
          return err;
        }}
      />

      <HeadDialog
        open={companyHeadOpen}
        title="Руководитель компании"
        current={company.head}
        search={searchCompanyEmployees}
        onClose={() => setCompanyHeadOpen(false)}
        onSave={async (userId) => {
          const err = await apply(updateOrgCompany(company.id, { head_user_id: userId }), "Руководитель компании обновлён");
          if (!err) setCompanyHeadOpen(false);
          return err;
        }}
      />

      <CreateDepartmentDialog
        open={createDeptOpen}
        search={searchCompanyEmployees}
        onClose={() => setCreateDeptOpen(false)}
        onCreate={async (name, headId) => {
          const res = await createOrgDepartment(company.id, { name, head_user_id: headId });
          if (!res.ok) return res.error;
          refresh(res.data);
          toast({ title: "Отдел создан" });
          setCreateDeptOpen(false);
          const created = res.data.departments.find((d) => d.is_active && d.name === name.trim());
          if (created) setSelection(created.id);
          return null;
        }}
      />

      <NameDialog
        open={renameDept != null}
        title="Переименовать отдел"
        label="Название отдела"
        initial={renameDept?.name ?? ""}
        onClose={() => setRenameDept(null)}
        onSubmit={async (name) => {
          if (!renameDept) return null;
          const err = await apply(updateOrgDepartment(renameDept.id, { name }), "Отдел переименован");
          if (!err) setRenameDept(null);
          return err;
        }}
      />

      <HeadDialog
        open={deptHead != null}
        title={`Руководитель отдела «${deptHead?.name ?? ""}»`}
        hint="Можно выбрать любого сотрудника компании — он не обязан состоять в этом отделе."
        current={deptHead?.head ?? null}
        search={searchCompanyEmployees}
        onClose={() => setDeptHead(null)}
        onSave={async (userId) => {
          if (!deptHead) return null;
          const err = await apply(updateOrgDepartment(deptHead.id, { head_user_id: userId }), "Руководитель отдела обновлён");
          if (!err) setDeptHead(null);
          return err;
        }}
      />

      <AddEmployeeDialog
        open={addEmployeeOpen}
        companyId={company.id}
        departments={activeDepartments}
        defaultDepartmentId={selectedDept?.is_active ? selectedDept.id : null}
        onClose={() => setAddEmployeeOpen(false)}
        onAdd={async (userId, departmentId) => {
          const err = await apply(
            addOrgEmployee(company.id, { user_id: userId, department_id: departmentId }),
            "Сотрудник добавлен",
          );
          if (!err) setAddEmployeeOpen(false);
          return err;
        }}
      />

      <MoveEmployeeDialog
        employee={moveEmployee}
        departments={activeDepartments}
        onClose={() => setMoveEmployee(null)}
        onMove={async (departmentId) => {
          if (!moveEmployee) return null;
          const err = await apply(
            changeOrgEmployeeDepartment(company.id, moveEmployee.id, departmentId),
            departmentId == null ? "Сотрудник переведён в «Без отдела»" : "Отдел сотрудника изменён",
          );
          if (!err) setMoveEmployee(null);
          return err;
        }}
      />

      <ConfirmDialog
        open={confirm != null}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.confirmLabel ?? "OK"}
        destructive={confirm?.destructive}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const err = await apply(confirm.run(), confirm.success);
          if (!err) setConfirm(null);
        }}
      />

      <LogDialog
        open={logOpen}
        title={`Журнал изменений · ${company.name}`}
        fetchPage={fetchLogs}
        describe={describeOrgLog}
        onClose={() => setLogOpen(false)}
      />
    </div>
  );
}

function DeptItem({
  icon,
  label,
  hint,
  count,
  selected,
  inactive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  count: number;
  selected: boolean;
  inactive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
        selected ? "bg-[rgba(243,87,19,0.18)] text-foreground" : "hover:bg-white/5",
        inactive && "opacity-60",
      )}
    >
      <span className={cn(selected ? "text-[#F35713]" : "text-muted-foreground")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{label}</span>
        {hint ? <span className="block truncate text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </button>
  );
}

function IconAction({
  label,
  onClick,
  destructive,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        // без слова «destructive» в классах: глобальный .client-desktop-dark button[class*="destructive"] красит фон
        destructive ? "text-red-400 hover:bg-red-500/10" : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Назначение / смена / снятие руководителя через поиск среди сотрудников компании. */
function HeadDialog({
  open,
  title,
  hint,
  current,
  search,
  onSave,
  onClose,
}: {
  open: boolean;
  title: string;
  hint?: string;
  current: OrgUserBrief | null;
  search: (q: string) => Promise<OrgEmployee[]>;
  onSave: (userId: number | null) => Promise<string | null>;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const save = async (userId: number | null) => {
    setSaving(true);
    await onSave(userId);
    setSaving(false);
  };
  return (
    <ManagementModalShell open={open} onClose={() => !saving && onClose()} title={title}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Текущий руководитель</Label>
          {current ? (
            <SelectedChip
              label={current.full_name}
              secondary={current.position}
              onClear={() => void save(null)}
              disabled={saving}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Не назначен</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{current ? "Сменить на" : "Назначить"}</Label>
          <SearchPicker<OrgEmployee>
            load={search}
            getKey={(u) => u.id}
            onSelect={(u) => void save(u.id)}
            isItemDisabled={(u) => u.id === current?.id}
            placeholder="Поиск сотрудника компании по имени"
            renderItem={(u) => (
              <PersonOption name={u.full_name} secondary={[u.position, u.department?.name ?? "Без отдела"].filter(Boolean).join(" · ")} />
            )}
            disabled={saving}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {hint ? `${hint} ` : ""}Руководитель — информационная метка и не даёт дополнительных прав.
          </p>
        </div>
        {saving ? (
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#F35713]" />
          </div>
        ) : null}
      </div>
    </ManagementModalShell>
  );
}

function CreateDepartmentDialog({
  open,
  search,
  onCreate,
  onClose,
}: {
  open: boolean;
  search: (q: string) => Promise<OrgEmployee[]>;
  onCreate: (name: string, headId: number | null) => Promise<string | null>;
  onClose: () => void;
}) {
  const [head, setHead] = useState<OrgEmployee | null>(null);
  useEffect(() => {
    if (open) setHead(null);
  }, [open]);
  return (
    <NameDialog
      open={open}
      title="Новый отдел"
      label="Название отдела"
      initial=""
      placeholder="Например, Маркетинг"
      submitLabel="Создать"
      onClose={onClose}
      onSubmit={(name) => onCreate(name, head?.id ?? null)}
    >
      <div className="space-y-2">
        <Label>Руководитель отдела (необязательно)</Label>
        {head ? (
          <SelectedChip label={head.full_name} secondary={head.position} onClear={() => setHead(null)} />
        ) : (
          <SearchPicker<OrgEmployee>
            load={search}
            getKey={(u) => u.id}
            onSelect={setHead}
            placeholder="Поиск сотрудника компании"
            renderItem={(u) => <PersonOption name={u.full_name} secondary={u.position ?? u.department?.name ?? "Без отдела"} />}
          />
        )}
      </div>
    </NameDialog>
  );
}

const NONE_VALUE = "__none__";

function AddEmployeeDialog({
  open,
  companyId,
  departments,
  defaultDepartmentId,
  onAdd,
  onClose,
}: {
  open: boolean;
  companyId: number;
  departments: OrgDepartment[];
  defaultDepartmentId: number | null;
  onAdd: (userId: number, departmentId: number | null) => Promise<string | null>;
  onClose: () => void;
}) {
  const [user, setUser] = useState<OrgCandidate | null>(null);
  const [dept, setDept] = useState<string>(NONE_VALUE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUser(null);
      setDept(defaultDepartmentId != null ? String(defaultDepartmentId) : NONE_VALUE);
      setError(null);
    }
  }, [open, defaultDepartmentId]);

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    const err = await onAdd(user.id, dept === NONE_VALUE ? null : Number(dept));
    setSaving(false);
    setError(err);
  };

  return (
    <ManagementModalShell open={open} onClose={() => !saving && onClose()} title="Добавить сотрудника">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Пользователь Workflow</Label>
          {user ? (
            <SelectedChip label={user.full_name} secondary={user.position ?? user.phone} onClear={() => setUser(null)} />
          ) : (
            <SearchPicker<OrgCandidate>
              load={(q) => searchOrgCandidates(companyId, q)}
              getKey={(u) => u.id}
              onSelect={setUser}
              isItemDisabled={(u) => u.company_id != null}
              placeholder="Поиск по имени или телефону"
              renderItem={(u) => (
                <PersonOption
                  name={u.full_name}
                  secondary={u.position ?? u.phone}
                  hint={u.company ? `Уже в компании «${u.company.name}»` : null}
                />
              )}
              autoFocus
            />
          )}
          <p className="text-xs text-muted-foreground">
            Только зарегистрированные клиенты этого офиса. Сотрудник может состоять только в одной компании.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Отдел</Label>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[300]">
              <SelectItem value={NONE_VALUE}>Без отдела</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={() => void submit()} disabled={saving || !user}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Добавить
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
        </div>
      </div>
    </ManagementModalShell>
  );
}

function MoveEmployeeDialog({
  employee,
  departments,
  onMove,
  onClose,
}: {
  employee: OrgEmployee | null;
  departments: OrgDepartment[];
  onMove: (departmentId: number | null) => Promise<string | null>;
  onClose: () => void;
}) {
  const [dept, setDept] = useState<string>(NONE_VALUE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setDept(employee.department_id != null ? String(employee.department_id) : NONE_VALUE);
      setError(null);
    }
  }, [employee]);

  const currentValue = employee?.department_id != null ? String(employee.department_id) : NONE_VALUE;

  const submit = async () => {
    setSaving(true);
    const err = await onMove(dept === NONE_VALUE ? null : Number(dept));
    setSaving(false);
    setError(err);
  };

  return (
    <ManagementModalShell open={employee != null} onClose={() => !saving && onClose()} title="Перевести в отдел">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {employee?.full_name} · сейчас: {employee?.department?.name ?? "Без отдела"}
        </p>
        <div className="space-y-2">
          <Label>Новый отдел</Label>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[300]">
              <SelectItem value={NONE_VALUE}>Без отдела</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={() => void submit()} disabled={saving || dept === currentValue}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Перевести
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
        </div>
      </div>
    </ManagementModalShell>
  );
}
