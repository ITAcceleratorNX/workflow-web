"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  ChevronRight,
  Filter,
  Loader2,
  Phone,
  Search,
  Briefcase,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatPhone } from "@/lib/phone-utils";
import type { Company } from "@/lib/companies-api";
import { getOfficeCompanies } from "@/lib/companies-api";
import type { ServiceCategory } from "@/lib/service-categories-api";
import { getServiceCategories } from "@/lib/service-categories-api";
import {
  changeUserPassword,
  deleteExecutor,
  getExecutorByUserId,
  getExecutors,
  getUsersForManagement,
  updateExecutor,
  updateUserProfile,
  updateUserRole,
  type ExecutorInCategory,
  type OfficeUser,
} from "@/lib/users-management-api";
import { useAuthStore } from "@/stores/useAuthStore";

const ROLE_LABELS: Record<string, string> = {
  client: "Клиент",
  executor: "Исполнитель",
};

const OFFICE_STAFF_ROLES = ["client", "executor"] as const;
type OfficeStaffRole = (typeof OFFICE_STAFF_ROLES)[number];
type RoleFilter = "all" | OfficeStaffRole;
type SortOption = "name-asc" | "name-desc" | "role";

const ROLE_FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "client", label: "Клиенты" },
  { value: "executor", label: "Исполнители" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "А–Я" },
  { value: "name-desc", label: "Я–А" },
  { value: "role", label: "По роли" },
];

type OfficeUserRow = OfficeUser & { executor?: ExecutorInCategory };

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function userMatchesSearch(row: OfficeUserRow, query: string) {
  if (!query) return true;
  const haystack = [row.full_name, row.phone, row.executor?.specialty]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const categoryNames = (row.executor?.serviceCategories ?? [])
    .map((c) => c.name)
    .join(" ")
    .toLowerCase();
  return `${haystack} ${categoryNames}`.includes(query);
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
        active
          ? "border-[#F35713] bg-[rgba(243,87,19,0.2)] text-[#F35713]"
          : "border-border text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function applyExecutorFields(
  executor: ExecutorInCategory,
  setters: {
    setSpecialty: (v: string) => void;
    setSelectedCategoryIds: (v: number[]) => void;
    setFullName?: (v: string) => void;
    setPhone?: (v: string) => void;
  },
) {
  setters.setSpecialty(executor.specialty?.trim() ?? "");
  setters.setSelectedCategoryIds(executor.serviceCategories?.map((c) => c.id) ?? []);
  if (setters.setFullName && executor.user?.full_name) {
    setters.setFullName(executor.user.full_name);
  }
  if (setters.setPhone && executor.user?.phone) {
    setters.setPhone(formatPhone(executor.user.phone));
  }
}

export function DepartmentHeadUserManagementTab() {
  const { toast } = useToast();
  const officeId = useAuthStore((s) => s.user?.office_id);

  const [users, setUsers] = useState<OfficeUserRow[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [categoryFilterId, setCategoryFilterId] = useState<number | null>(null);
  const [companyFilterId, setCompanyFilterId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  const [editUser, setEditUser] = useState<OfficeUserRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<OfficeStaffRole>("client");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+7 ");
  const [specialty, setSpecialty] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [draftCompanyId, setDraftCompanyId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(typeof document !== "undefined");
  }, []);

  const load = useCallback(async () => {
    if (!officeId) {
      setUsers([]);
      setCategories([]);
      setCompanies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const officeIdNum = Number(officeId);
    const [usersRes, execRes, catRes, companiesRes] = await Promise.all([
      getUsersForManagement({
        officeId: String(officeId),
        companyId:
          roleFilter !== "executor" && companyFilterId != null
            ? String(companyFilterId)
            : undefined,
      }),
      getExecutors(undefined, officeIdNum),
      getServiceCategories(officeIdNum),
      getOfficeCompanies(officeIdNum),
    ]);

    if (catRes.ok) setCategories(catRes.data);
    else setCategories([]);
    if (companiesRes.ok) setCompanies(companiesRes.data);
    else setCompanies([]);

    const executorByUserId = new Map<number, ExecutorInCategory>();
    if (execRes.ok) {
      for (const exec of execRes.data) {
        const uid = exec.user?.id;
        if (uid) executorByUserId.set(uid, exec);
      }
    }

    if (usersRes.ok) {
      const rows: OfficeUserRow[] = usersRes.data
        .filter((u) => OFFICE_STAFF_ROLES.includes(u.role as OfficeStaffRole))
        .map((u) => ({
          ...u,
          executor: executorByUserId.get(u.id),
        }));
      setUsers(rows);
    } else {
      setUsers([]);
      toast({ title: "Ошибка", description: usersRes.error, variant: "destructive" });
    }
    setLoading(false);
  }, [officeId, roleFilter, companyFilterId, toast]);

  useEffect(() => {
    if (roleFilter === "executor") setCompanyFilterId(null);
  }, [roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!editUser || selectedRole !== "executor") return;
    if (editUser.executor) {
      applyExecutorFields(editUser.executor, {
        setSpecialty,
        setSelectedCategoryIds,
        setFullName,
        setPhone,
      });
      return;
    }
    if (editUser.role !== "executor") {
      setSpecialty("");
      setSelectedCategoryIds([]);
      return;
    }
    let cancelled = false;
    void getExecutorByUserId(editUser.id).then((res) => {
      if (cancelled || !res.ok) return;
      applyExecutorFields(res.data, {
        setSpecialty,
        setSelectedCategoryIds,
        setFullName,
        setPhone,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, executor: res.data } : u)),
      );
      setEditUser((prev) => (prev ? { ...prev, executor: res.data } : prev));
    });
    return () => {
      cancelled = true;
    };
  }, [editUser?.id, editUser?.role, selectedRole]);

  const stats = useMemo(() => {
    const clients = users.filter((u) => u.role === "client").length;
    const executors = users.filter((u) => u.role === "executor").length;
    return { total: users.length, clients, executors };
  }, [users]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    roleFilter !== "all" ||
    categoryFilterId !== null ||
    companyFilterId !== null;

  const filteredUsers = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    let list = users.filter((row) => {
      if (roleFilter !== "all" && row.role !== roleFilter) return false;
      if (categoryFilterId != null) {
        if (row.role !== "executor" || !row.executor) return false;
        const ids = row.executor.serviceCategories?.map((c) => c.id) ?? [];
        if (!ids.includes(categoryFilterId)) return false;
      }
      return userMatchesSearch(row, q);
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "role") {
        const roleOrder = a.role === b.role ? 0 : a.role === "client" ? -1 : 1;
        if (roleOrder !== 0) return roleOrder;
      }
      const cmp = (a.full_name ?? "").localeCompare(b.full_name ?? "", "ru", {
        sensitivity: "base",
      });
      return sortBy === "name-desc" ? -cmp : cmp;
    });

    return list;
  }, [users, searchQuery, roleFilter, categoryFilterId, sortBy]);

  const formCategories = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    for (const id of selectedCategoryIds) {
      if (byId.has(id)) continue;
      const fromExecutor = editUser?.executor?.serviceCategories?.find((c) => c.id === id);
      if (fromExecutor) {
        byId.set(id, { id: fromExecutor.id, name: fromExecutor.name });
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [categories, selectedCategoryIds, editUser]);

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setCategoryFilterId(null);
    setCompanyFilterId(null);
    setSortBy("name-asc");
  };

  const closeEdit = () => {
    setEditUser(null);
    setSelectedRole("client");
    setFullName("");
    setPhone("+7 ");
    setSpecialty("");
    setSelectedCategoryIds([]);
    setDraftCompanyId("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };

  const openEdit = (row: OfficeUserRow) => {
    setEditUser(row);
    setSelectedRole(row.role === "executor" ? "executor" : "client");
    setFullName(row.full_name ?? "");
    setPhone(formatPhone(row.phone ?? ""));
    setSpecialty(row.executor?.specialty?.trim() ?? "");
    setSelectedCategoryIds(row.executor?.serviceCategories?.map((c) => c.id) ?? []);
    setDraftCompanyId(row.company_id != null ? String(row.company_id) : "");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };

  const selectRole = (r: OfficeStaffRole) => {
    setSelectedRole(r);
    if (r === "executor" && editUser) {
      if (editUser.executor) {
        applyExecutorFields(editUser.executor, {
          setSpecialty,
          setSelectedCategoryIds,
          setFullName,
          setPhone,
        });
      } else if (editUser.role !== "executor") {
        setSpecialty("");
        setSelectedCategoryIds([]);
      }
    }
  };

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleDelete = async (row: OfficeUserRow) => {
    if (!row.executor) return;
    if (!window.confirm(`Удалить исполнителя «${row.full_name}»?`)) return;
    const res = await deleteExecutor(row.executor.id);
    if (res.ok) {
      toast({ title: "Исполнитель удалён" });
      void load();
    } else {
      toast({ title: "Ошибка", description: res.error, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!editUser) return;
    setPasswordError(null);

    const passwordFilled = newPassword.trim().length > 0;
    if (passwordFilled) {
      if (newPassword !== confirmPassword) {
        setPasswordError("Пароли не совпадают");
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError("Пароль должен содержать минимум 6 символов");
        return;
      }
    }

    const isExecutorForm = selectedRole === "executor";
    const basicProfileChanged =
      fullName.trim() !== (editUser.full_name ?? "").trim() ||
      phone !== formatPhone(editUser.phone ?? "");

    if (!fullName.trim()) {
      toast({ title: "Укажите ФИО", variant: "destructive" });
      return;
    }

    if (isExecutorForm) {
      if (!specialty.trim() || selectedCategoryIds.length === 0) {
        toast({
          title: "Укажите специальность и хотя бы одну категорию",
          variant: "destructive",
        });
        return;
      }
    }

    const initialRole = editUser.role as OfficeStaffRole;
    const roleChanged = initialRole !== selectedRole;
    const promotingToExecutor = roleChanged && selectedRole === "executor";
    const demotingToClient = roleChanged && selectedRole === "client";
    const needsUserProfileUpdate = basicProfileChanged && !isExecutorForm;

    const initialCompanyId = editUser.company_id != null ? Number(editUser.company_id) : null;
    const draftCompanyNumeric =
      draftCompanyId.trim() !== "" && Number.isFinite(Number(draftCompanyId))
        ? Number(draftCompanyId)
        : null;
    const companyChanged =
      !roleChanged && selectedRole === "client" && draftCompanyNumeric !== initialCompanyId;

    if (
      !passwordFilled &&
      !roleChanged &&
      !needsUserProfileUpdate &&
      !companyChanged &&
      !(isExecutorForm && editUser.executor && !demotingToClient)
    ) {
      const executorOnlyProfileChange =
        isExecutorForm && editUser.executor && !demotingToClient && basicProfileChanged;
      if (!executorOnlyProfileChange) {
        toast({ title: "Нет изменений" });
        return;
      }
    }

    setSaving(true);

    if (passwordFilled) {
      const pwdRes = await changeUserPassword(editUser.id, newPassword);
      if (!pwdRes.ok) {
        setSaving(false);
        setPasswordError(pwdRes.error);
        return;
      }
    }

    if (roleChanged) {
      const roleRes = await updateUserRole(editUser.id, selectedRole, {
        category_ids: promotingToExecutor ? selectedCategoryIds : undefined,
        specialty: promotingToExecutor ? specialty.trim() : undefined,
      });
      if (!roleRes.ok) {
        setSaving(false);
        toast({ title: "Ошибка", description: roleRes.error, variant: "destructive" });
        return;
      }
    }

    if (needsUserProfileUpdate || companyChanged) {
      const profileBody: {
        full_name?: string;
        phone?: string;
        company_id?: number | null;
      } = {};
      if (needsUserProfileUpdate) {
        profileBody.full_name = fullName.trim();
        profileBody.phone = phone;
      }
      if (companyChanged) profileBody.company_id = draftCompanyNumeric;
      const profileRes = await updateUserProfile(editUser.id, profileBody);
      if (!profileRes.ok) {
        setSaving(false);
        toast({ title: "Ошибка", description: profileRes.error, variant: "destructive" });
        return;
      }
    }

    if (isExecutorForm && !demotingToClient) {
      let executorId = editUser.executor?.id;
      if (!executorId && promotingToExecutor && officeId) {
        const execListRes = await getExecutors(undefined, Number(officeId));
        if (execListRes.ok) {
          executorId = execListRes.data.find((e) => e.user?.id === editUser.id)?.id;
        }
      }
      if (executorId) {
        const execRes = await updateExecutor(executorId, {
          full_name: fullName.trim(),
          phone,
          specialty: specialty.trim(),
          category_ids: selectedCategoryIds,
        });
        if (!execRes.ok) {
          setSaving(false);
          toast({ title: "Ошибка", description: execRes.error, variant: "destructive" });
          return;
        }
      }
    }

    setSaving(false);
    toast({ title: "Изменения сохранены" });
    closeEdit();
    void load();
  };

  const isExecutorForm = selectedRole === "executor";

  const editModal =
    editUser && portalReady
      ? createPortal(
          <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Закрыть"
              onClick={() => !saving && closeEdit()}
            />
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-border bg-background px-4 pb-8 pt-4 sm:rounded-2xl sm:border">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">Редактировать</h2>
                <button
                  type="button"
                  onClick={() => !saving && closeEdit()}
                  className="rounded-lg p-2 active:opacity-70"
                  aria-label="Закрыть"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Роль</p>
                  <div className="flex flex-wrap gap-2">
                    {OFFICE_STAFF_ROLES.map((r) => (
                      <FilterPill
                        key={r}
                        active={selectedRole === r}
                        label={ROLE_LABELS[r]}
                        onClick={() => selectRole(r)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Новый пароль
                  </p>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Оставьте пустым, если не меняете"
                  />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Подтверждение пароля"
                    className="mt-2"
                  />
                  {passwordError ? (
                    <p className="mt-1 text-sm text-destructive">{passwordError}</p>
                  ) : null}
                </div>

                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ФИО"
                />
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Телефон
                  </p>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="+7 XXX XXX XX XX"
                    maxLength={19}
                  />
                </div>

                {selectedRole === "client" && companies.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Компания
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <FilterPill
                        active={draftCompanyId === ""}
                        label="Не указана"
                        onClick={() => setDraftCompanyId("")}
                      />
                      {companies.map((c) => (
                        <FilterPill
                          key={c.id}
                          active={draftCompanyId === String(c.id)}
                          label={c.name}
                          onClick={() => setDraftCompanyId(String(c.id))}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {isExecutorForm ? (
                  <>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Специальность
                      </p>
                      <Input
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Например: электрик"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                        Категории услуг
                      </p>
                      {formCategories.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Нет категорий для вашего офиса
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {formCategories.map((c) => (
                            <FilterPill
                              key={c.id}
                              active={selectedCategoryIds.includes(c.id)}
                              label={c.name}
                              onClick={() => toggleCategory(c.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-border py-3 text-foreground disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center rounded-xl bg-[#F35713] py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  if (!officeId) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Офис не указан в профиле
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <p className="text-[13px] text-muted-foreground">
          {stats.total}{" "}
          {stats.total === 1
            ? "пользователь"
            : stats.total < 5
              ? "пользователя"
              : "пользователей"}
          {" · "}
          {stats.clients}{" "}
          {stats.clients === 1 ? "клиент" : stats.clients < 5 ? "клиента" : "клиентов"}
          {" · "}
          {stats.executors}{" "}
          {stats.executors === 1 ? "исполнитель" : stats.executors < 5 ? "исполнителя" : "исполнителей"}
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по имени, телефону, специальности…"
          className="min-h-11 flex-1 bg-transparent py-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="rounded-lg p-1 active:opacity-70"
            aria-label="Очистить поиск"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : null}
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {ROLE_FILTER_OPTIONS.map((opt) => {
          const active = roleFilter === opt.value;
          const count =
            opt.value === "all"
              ? stats.total
              : opt.value === "client"
                ? stats.clients
                : stats.executors;
          return (
            <FilterPill
              key={opt.value}
              active={active}
              label={`${opt.label} (${count})`}
              onClick={() => setRoleFilter(opt.value)}
            />
          );
        })}
      </div>

      {roleFilter !== "executor" && companies.length > 0 ? (
        <>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Компания</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <FilterPill
              active={companyFilterId === null}
              label="Все компании"
              onClick={() => setCompanyFilterId(null)}
            />
            {companies.map((c) => {
              const active = companyFilterId === c.id;
              return (
                <FilterPill
                  key={c.id}
                  active={active}
                  label={c.name}
                  onClick={() => setCompanyFilterId(active ? null : c.id)}
                />
              );
            })}
          </div>
        </>
      ) : null}

      {categories.length > 0 ? (
        <>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Категория услуг</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <FilterPill
              active={categoryFilterId === null}
              label="Все категории"
              onClick={() => setCategoryFilterId(null)}
            />
            {categories.map((c) => {
              const active = categoryFilterId === c.id;
              return (
                <FilterPill
                  key={c.id}
                  active={active}
                  label={c.name}
                  onClick={() => setCategoryFilterId(active ? null : c.id)}
                />
              );
            })}
          </div>
        </>
      ) : null}

      <div className="flex items-center gap-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Сортировка</p>
        <div className="flex gap-2 overflow-x-auto">
          {SORT_OPTIONS.map((opt) => {
            const active = sortBy === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSortBy(opt.value)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-[#F35713] bg-[#F35713] text-white"
                    : "border-border text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex items-center gap-2 py-1">
          <p className="flex-1 text-[13px] text-muted-foreground">
            Найдено: {filteredUsers.length}
            {filteredUsers.length !== users.length ? ` из ${users.length}` : ""}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-[13px] font-semibold text-[#F35713]"
          >
            Сбросить
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#F35713]" />
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <p className="font-semibold text-foreground">Пользователей пока нет</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Клиенты и исполнители вашего офиса появятся здесь после регистрации
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <Filter className="h-12 w-12 text-muted-foreground" />
          <p className="font-semibold text-foreground">Никого не найдено</p>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-[#F35713] px-4 py-2 font-semibold text-[#F35713]"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredUsers.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-border bg-card p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="min-w-0 flex-1 text-left active:opacity-90"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {row.full_name || `Пользователь #${row.id}`}
                    </p>
                    <span
                      className={`inline-block rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                        row.role === "executor"
                          ? "border-[#F35713] bg-[rgba(243,87,19,0.12)] text-[#F35713]"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {ROLE_LABELS[row.role] ?? row.role}
                    </span>
                  </div>
                  {row.phone ? (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {row.phone}
                    </div>
                  ) : null}
                  {row.role === "client" ? (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {row.company?.name ?? "Не указана"}
                    </div>
                  ) : null}
                  {row.executor?.specialty ? (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      {row.executor.specialty}
                    </div>
                  ) : null}
                  {(row.executor?.serviceCategories ?? []).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(row.executor?.serviceCategories ?? []).map((c) => (
                        <span
                          key={c.id}
                          className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="rounded-lg p-1 active:opacity-70"
                    aria-label="Редактировать"
                  >
                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                  </button>
                  {row.executor ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete(row)}
                      className="rounded-lg p-1 active:opacity-70"
                      aria-label="Удалить исполнителя"
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editModal}
    </div>
  );
}
