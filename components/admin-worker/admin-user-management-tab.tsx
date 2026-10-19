"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatExecutorSpecialty,
  formatServiceCategoryName,
  isExecutorServiceCategory,
} from "@/constants/requests";
import {
  Building2,
  ChevronRight,
  Filter,
  Loader2,
  Phone,
  Search,
  Users,
  X,
} from "lucide-react";
import { ManagementModalShell } from "@/components/layout/management-modal-shell";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useIsDesktop } from "@/hooks/use-media-query";
import { formatPhone } from "@/lib/phone-utils";
import type { Company } from "@/lib/companies-api";
import { getOfficeCompanies } from "@/lib/companies-api";
import type { Office, ServiceCategory } from "@/lib/service-categories-api";
import {
  changeUserPassword,
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
import {
  formatExecutorOfficeAccess,
  isExecutorOfficeAccessValid,
  sameExecutorOfficeAccess,
  toggleExecutorOffice,
  type ExecutorOfficeAccess,
} from "@/lib/executor-office-access";

const ROLE_LABELS: Record<string, string> = {
  client: "Клиент",
  "admin-worker": "Администратор офиса",
  "department-head": "Офис-менеджер",
  executor: "Исполнитель",
  manager: "Руководитель",
};

const ROLE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Все роли" },
  ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
];

type SortOption = "name-asc" | "name-desc" | "role";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "А–Я" },
  { value: "name-desc", label: "Я–А" },
  { value: "role", label: "По роли" },
];

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function userMatchesSearch(user: OfficeUser, query: string) {
  if (!query) return true;
  const haystack = [user.full_name, user.phone, ROLE_LABELS[user.role], user.office?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
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

/** Категории Исполнителя для формы: «Администрацию» Исполнителю больше не назначают. */
function executorCategoryIds(executor: ExecutorInCategory): number[] {
  return (executor.serviceCategories ?? [])
    .filter((c) => isExecutorServiceCategory(c.name))
    .map((c) => c.id);
}

function applyExecutorToForm(
  executor: ExecutorInCategory,
  setters: {
    setSpecialty: (v: string) => void;
    setSelectedCategoryIds: (v: number[]) => void;
    setFullName?: (v: string) => void;
    setPhone?: (v: string) => void;
  },
) {
  setters.setSpecialty(formatExecutorSpecialty(executor.specialty));
  setters.setSelectedCategoryIds(executorCategoryIds(executor));
  if (setters.setFullName && executor.user?.full_name) {
    setters.setFullName(executor.user.full_name);
  }
  if (setters.setPhone && executor.user?.phone) {
    setters.setPhone(formatPhone(executor.user.phone));
  }
}

type AdminUserManagementTabProps = {
  offices: Office[];
  categories: ServiceCategory[];
  isActive: boolean;
  onRegisterRefresh?: (refetch: () => Promise<void>) => void;
};

export function AdminUserManagementTab({
  offices,
  categories,
  isActive,
  onRegisterRefresh,
}: AdminUserManagementTabProps) {
  const { toast } = useToast();
  const authOfficeId = useAuthStore((s) => s.user?.office_id);

  const [officeUsers, setOfficeUsers] = useState<OfficeUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [officeFilterId, setOfficeFilterId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  const [executorByUserId, setExecutorByUserId] = useState<Record<number, ExecutorInCategory>>({});
  const [editUser, setEditUser] = useState<OfficeUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newRole, setNewRole] = useState("");
  const [draftOfficeId, setDraftOfficeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+7 ");
  const [specialty, setSpecialty] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [companyFilterId, setCompanyFilterId] = useState("");
  const [companiesByOfficeId, setCompaniesByOfficeId] = useState<Record<number, Company[]>>({});
  const [draftCompanyId, setDraftCompanyId] = useState("");
  const [draftOfficeAccess, setDraftOfficeAccess] = useState<ExecutorOfficeAccess>({
    all_offices: false,
    office_ids: [],
  });

  const isDesktop = useIsDesktop();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const officeIdNum = officeFilterId
      ? Number(officeFilterId)
      : authOfficeId
        ? Number(authOfficeId)
        : undefined;
    const useCompanyFilter = roleFilter === "client" && companyFilterId !== "";
    const [usersRes, execRes] = await Promise.all([
      getUsersForManagement({
        officeId: officeFilterId || undefined,
        companyId: useCompanyFilter ? companyFilterId : undefined,
      }),
      getExecutors(undefined, officeIdNum),
    ]);

    if (execRes.ok) {
      const map: Record<number, ExecutorInCategory> = {};
      for (const exec of execRes.data) {
        const uid = exec.user?.id;
        if (uid) map[uid] = exec;
      }
      setExecutorByUserId(map);
    } else {
      setExecutorByUserId({});
    }

    if (usersRes.ok) setOfficeUsers(usersRes.data);
    else {
      setOfficeUsers([]);
      toast({ title: "Ошибка", description: usersRes.error, variant: "destructive" });
    }
    setLoading(false);
  }, [officeFilterId, authOfficeId, roleFilter, companyFilterId, toast]);

  const loadCompaniesForOffice = useCallback(
    async (officeIdNum: number) => {
      if (!Number.isFinite(officeIdNum) || officeIdNum <= 0) return [];
      if (companiesByOfficeId[officeIdNum]) return companiesByOfficeId[officeIdNum];
      const res = await getOfficeCompanies(officeIdNum);
      const list = res.ok ? res.data : [];
      setCompaniesByOfficeId((prev) => ({ ...prev, [officeIdNum]: list }));
      return list;
    },
    [companiesByOfficeId],
  );

  useEffect(() => {
    if (roleFilter !== "client") return;
    const officeIdNum = officeFilterId
      ? Number(officeFilterId)
      : authOfficeId
        ? Number(authOfficeId)
        : NaN;
    if (Number.isFinite(officeIdNum) && officeIdNum > 0) {
      void loadCompaniesForOffice(officeIdNum);
    }
  }, [roleFilter, officeFilterId, authOfficeId, loadCompaniesForOffice]);

  useEffect(() => {
    if (roleFilter !== "client") setCompanyFilterId("");
  }, [roleFilter]);

  useEffect(() => {
    setCompanyFilterId("");
  }, [officeFilterId]);

  useEffect(() => {
    if (!editUser || newRole !== "executor") return;
    const cached = executorByUserId[editUser.id];
    if (cached) {
      applyExecutorToForm(cached, { setSpecialty, setSelectedCategoryIds, setFullName, setPhone });
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
      setExecutorByUserId((prev) => ({ ...prev, [editUser.id]: res.data }));
      applyExecutorToForm(res.data, { setSpecialty, setSelectedCategoryIds, setFullName, setPhone });
    });
    return () => {
      cancelled = true;
    };
  }, [editUser, newRole, executorByUserId]);

  useEffect(() => {
    if (!isActive) return;
    loadUsers();
  }, [isActive, loadUsers]);

  useEffect(() => {
    onRegisterRefresh?.(loadUsers);
  }, [onRegisterRefresh, loadUsers]);

  const stats = useMemo(() => {
    const byRole: Record<string, number> = {};
    for (const u of officeUsers) {
      byRole[u.role] = (byRole[u.role] ?? 0) + 1;
    }
    return { total: officeUsers.length, byRole };
  }, [officeUsers]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || roleFilter !== "all" || officeFilterId !== "";

  const filteredUsers = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    let list = officeUsers.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      return userMatchesSearch(u, q);
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "role") {
        const cmpRole = (ROLE_LABELS[a.role] ?? a.role).localeCompare(
          ROLE_LABELS[b.role] ?? b.role,
          "ru",
        );
        if (cmpRole !== 0) return cmpRole;
      }
      const cmp = (a.full_name ?? "").localeCompare(b.full_name ?? "", "ru", {
        sensitivity: "base",
      });
      return sortBy === "name-desc" ? -cmp : cmp;
    });
    return list;
  }, [officeUsers, searchQuery, roleFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setOfficeFilterId("");
    setCompanyFilterId("");
    setSortBy("name-asc");
  };

  const sortedOffices = useMemo(
    () => [...offices].sort((a, b) => a.name.localeCompare(b.name, "ru")),
    [offices],
  );

  const modalCategories = useMemo(() => {
    const oid =
      draftOfficeId !== ""
        ? Number(draftOfficeId)
        : editUser?.office_id != null
          ? Number(editUser.office_id)
          : NaN;
    // «Администрацию» ведёт Офис-менеджер: Исполнителю её не назначают.
    const forExecutor = categories.filter((c) => isExecutorServiceCategory(c.name));
    if (!Number.isFinite(oid)) return forExecutor;
    return forExecutor.filter((c) => !c.office_id || Number(c.office_id) === Number(oid));
  }, [categories, editUser, draftOfficeId]);

  const isExecutorForm = newRole === "executor";
  const editingExecutor = editUser ? executorByUserId[editUser.id] : undefined;

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectDraftOffice = useCallback(
    (id: string) => {
      const prevOid = Number(draftOfficeId);
      setDraftOfficeId(id);
      const oidNum = Number(id);
      // Основной офис Исполнителя меняется и в выборе офисов, остальные офисы остаются.
      setDraftOfficeAccess((prev) => {
        if (prev.all_offices || !Number.isFinite(oidNum) || oidNum <= 0) return prev;
        const ids = prev.office_ids.filter((x) => x !== prevOid);
        if (!ids.includes(oidNum)) ids.push(oidNum);
        return { all_offices: false, office_ids: ids.sort((a, b) => a - b) };
      });
      setSelectedCategoryIds((prev) => {
        if (!Number.isFinite(oidNum)) return prev;
        return prev.filter((catId) => {
          const c = categories.find((x) => x.id === catId);
          return c != null && (!c.office_id || Number(c.office_id) === oidNum);
        });
      });
      setDraftCompanyId("");
      if (Number.isFinite(oidNum) && oidNum > 0) {
        void loadCompaniesForOffice(oidNum);
      }
    },
    [categories, draftOfficeId, loadCompaniesForOffice],
  );

  const selectRole = (roleId: string) => {
    setNewRole(roleId);
    if (roleId === "executor" && editUser) {
      const executor = executorByUserId[editUser.id];
      if (executor) {
        applyExecutorToForm(executor, { setSpecialty, setSelectedCategoryIds, setFullName, setPhone });
      } else if (editUser.role !== "executor") {
        setSpecialty("");
        setSelectedCategoryIds([]);
      }
    }
  };

  const openEdit = (user: OfficeUser) => {
    const executor = executorByUserId[user.id];
    setEditUser(user);
    setNewRole(user.role);
    setDraftOfficeId(user.office_id != null ? String(user.office_id) : "");
    setDraftCompanyId(user.company_id != null ? String(user.company_id) : "");
    setDraftOfficeAccess(
      user.executor_office_access ?? {
        all_offices: false,
        office_ids: user.office_id != null ? [Number(user.office_id)] : [],
      },
    );
    setFullName(user.full_name ?? "");
    setPhone(formatPhone(user.phone ?? ""));
    setSpecialty(formatExecutorSpecialty(executor?.specialty));
    setSelectedCategoryIds(executor ? executorCategoryIds(executor) : []);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setRoleError(null);
    if (user.office_id != null) {
      void loadCompaniesForOffice(Number(user.office_id));
    }
  };

  const closeEdit = () => {
    setEditUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhone("+7 ");
    setSpecialty("");
    setSelectedCategoryIds([]);
    setDraftOfficeId("");
    setDraftCompanyId("");
    setDraftOfficeAccess({ all_offices: false, office_ids: [] });
    setPasswordError(null);
    setRoleError(null);
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    setPasswordError(null);
    setRoleError(null);

    const passwordFilled = newPassword.trim().length > 0;
    if (passwordFilled) {
      if (newPassword !== confirmPassword) {
        setPasswordError("Пароли не совпадают");
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError("Минимум 6 символов");
        return;
      }
    }

    if (
      offices.length > 0 &&
      !draftOfficeId.trim() &&
      !["department-head", "manager", "admin-worker"].includes(editUser.role)
    ) {
      toast({ title: "Выберите офис", variant: "destructive" });
      return;
    }

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
      if (!isExecutorOfficeAccessValid(draftOfficeAccess)) {
        toast({ title: "Выберите хотя бы один офис или «Все офисы»", variant: "destructive" });
        return;
      }
    }

    const initialOfficeNumeric =
      editUser.office_id != null && Number.isFinite(Number(editUser.office_id))
        ? Number(editUser.office_id)
        : NaN;
    const draftOfficeNumeric =
      draftOfficeId.trim() !== "" && Number.isFinite(Number(draftOfficeId))
        ? Number(draftOfficeId)
        : NaN;
    const officeChanged =
      Number.isFinite(draftOfficeNumeric) &&
      (Number.isNaN(initialOfficeNumeric) || draftOfficeNumeric !== initialOfficeNumeric);

    const initialRole = editUser.role;
    const roleChanged = newRole && newRole !== initialRole;
    const promotingToExecutor = roleChanged && newRole === "executor";
    const demotingFromExecutor = roleChanged && initialRole === "executor" && newRole !== "executor";

    const useExecutorApiForProfile =
      isExecutorForm && !demotingFromExecutor && (!!editingExecutor || promotingToExecutor);

    const executorFieldsChanged =
      useExecutorApiForProfile &&
      editingExecutor &&
      (specialty.trim() !== formatExecutorSpecialty(editingExecutor.specialty) ||
        JSON.stringify([...selectedCategoryIds].sort()) !==
          JSON.stringify((editingExecutor.serviceCategories?.map((c) => c.id) ?? []).sort()) ||
        basicProfileChanged);

    const needsUserProfileUpdate = basicProfileChanged && !useExecutorApiForProfile;

    const initialCompanyId = editUser.company_id != null ? Number(editUser.company_id) : null;
    const draftCompanyNumeric =
      draftCompanyId.trim() !== "" && Number.isFinite(Number(draftCompanyId))
        ? Number(draftCompanyId)
        : null;
    const companyChanged =
      !roleChanged && newRole === "client" && draftCompanyNumeric !== initialCompanyId;

    // При переводе Исполнителя в другой основной офис сервер заменяет в выборе прежний офис
    // новым, поэтому сравниваем с тем, что получится после этой замены.
    const accessAfterOfficeChange: ExecutorOfficeAccess | null = (() => {
      if (initialRole !== "executor" || !editUser.executor_office_access) {
        return Number.isFinite(draftOfficeNumeric)
          ? { all_offices: false, office_ids: [draftOfficeNumeric] }
          : Number.isFinite(initialOfficeNumeric)
            ? { all_offices: false, office_ids: [initialOfficeNumeric] }
            : null;
      }
      const current = editUser.executor_office_access;
      if (!officeChanged || current.all_offices) return current;
      const ids = current.office_ids.filter((id) => id !== initialOfficeNumeric);
      if (!ids.includes(draftOfficeNumeric)) ids.push(draftOfficeNumeric);
      return { all_offices: false, office_ids: ids };
    })();
    const officeAccessChanged =
      isExecutorForm && !sameExecutorOfficeAccess(draftOfficeAccess, accessAfterOfficeChange);

    if (
      !passwordFilled &&
      !officeChanged &&
      !roleChanged &&
      !needsUserProfileUpdate &&
      !executorFieldsChanged &&
      !promotingToExecutor &&
      !companyChanged &&
      !officeAccessChanged
    ) {
      toast({ title: "Нет изменений" });
      return;
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

    const profilePut: {
      full_name?: string;
      phone?: string;
      office_id?: number;
      category_ids?: number[];
      company_id?: number | null;
    } = {};
    if (officeChanged && Number.isFinite(draftOfficeNumeric)) {
      profilePut.office_id = draftOfficeNumeric;
      if (isExecutorForm) profilePut.category_ids = selectedCategoryIds;
    }
    if (needsUserProfileUpdate) {
      profilePut.full_name = fullName.trim();
      profilePut.phone = phone;
    }
    if (companyChanged) profilePut.company_id = draftCompanyNumeric;
    if (Object.keys(profilePut).length > 0) {
      const profileRes = await updateUserProfile(editUser.id, profilePut);
      if (!profileRes.ok) {
        setSaving(false);
        setRoleError(profileRes.error);
        return;
      }
    }

    if (roleChanged) {
      const roleRes = await updateUserRole(editUser.id, newRole, {
        category_ids: promotingToExecutor ? selectedCategoryIds : undefined,
        specialty: promotingToExecutor ? specialty.trim() : undefined,
      });
      if (!roleRes.ok) {
        setSaving(false);
        setRoleError(roleRes.error);
        return;
      }
      setOfficeUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, role: newRole } : u)),
      );
    }

    const resolverOfficeId =
      officeChanged && Number.isFinite(draftOfficeNumeric)
        ? draftOfficeNumeric
        : editUser.office_id;

    let executorRecord = editingExecutor;
    if (promotingToExecutor && !executorRecord) {
      const execRes = await getExecutors(undefined, resolverOfficeId);
      if (execRes.ok) {
        executorRecord = execRes.data.find((e) => e.user?.id === editUser.id);
      }
    }

    if (useExecutorApiForProfile && executorRecord) {
      const execRes = await updateExecutor(executorRecord.id, {
        full_name: fullName.trim(),
        phone,
        specialty: specialty.trim(),
        category_ids: selectedCategoryIds,
      });
      if (!execRes.ok) {
        setSaving(false);
        setRoleError(execRes.error);
        return;
      }
    }

    if (officeAccessChanged) {
      const accessRes = await updateUserProfile(editUser.id, { office_access: draftOfficeAccess });
      if (!accessRes.ok) {
        setSaving(false);
        setRoleError(accessRes.error);
        return;
      }
    }

    setSaving(false);
    toast({ title: "Сохранено" });
    closeEdit();
    loadUsers();
  };

  const companyFilterList = (() => {
    const oid = officeFilterId
      ? Number(officeFilterId)
      : authOfficeId
        ? Number(authOfficeId)
        : NaN;
    return Number.isFinite(oid) ? (companiesByOfficeId[oid] ?? []) : [];
  })();

  const editUserSubtitle = editUser
    ? `${ROLE_LABELS[editUser.role]} · ${editUser.phone}${editUser.office?.name ? ` · ${editUser.office.name}` : ""}`
    : "";

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
          {officeFilterId
            ? ` · ${offices.find((o) => String(o.id) === officeFilterId)?.name ?? "офис"}`
            : " · все офисы"}
        </p>
      </div>

      <p className="text-xs font-semibold uppercase text-muted-foreground">Офис</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <FilterPill
          active={!officeFilterId}
          label="Все офисы"
          onClick={() => setOfficeFilterId("")}
        />
        {offices.map((o) => {
          const active = officeFilterId === String(o.id);
          return (
            <FilterPill
              key={o.id}
              active={active}
              label={o.name}
              onClick={() => setOfficeFilterId(active ? "" : String(o.id))}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по имени, телефону, роли…"
          className="min-h-11 flex-1 bg-transparent py-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {ROLE_FILTER_OPTIONS.map((opt) => {
          const active = roleFilter === opt.value;
          const count = opt.value === "all" ? stats.total : (stats.byRole[opt.value] ?? 0);
          return (
            <FilterPill
              key={opt.value}
              active={active}
              label={`${opt.label}${count > 0 ? ` (${count})` : ""}`}
              onClick={() => setRoleFilter(opt.value)}
            />
          );
        })}
      </div>

      {roleFilter === "client" && companyFilterList.length > 0 ? (
        <>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Компания</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <FilterPill
              active={companyFilterId === ""}
              label="Все компании"
              onClick={() => setCompanyFilterId("")}
            />
            {companyFilterList.map((c) => {
              const active = companyFilterId === String(c.id);
              return (
                <FilterPill
                  key={c.id}
                  active={active}
                  label={c.name}
                  onClick={() => setCompanyFilterId(active ? "" : String(c.id))}
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
            {filteredUsers.length !== officeUsers.length ? ` из ${officeUsers.length}` : ""}
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
      ) : officeUsers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <Users className="h-12 w-12 text-muted-foreground" />
          <p className="font-semibold text-foreground">Пользователей нет</p>
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
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => openEdit(user)}
              className="w-full rounded-xl border border-border bg-card p-3.5 text-left active:opacity-90"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="font-semibold text-foreground">{user.full_name}</p>
                  <span className="inline-block rounded-lg border border-border bg-[rgba(243,87,19,0.12)] px-2 py-0.5 text-[11px] font-semibold text-[#F35713]">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
                <ChevronRight className="h-6 w-6 shrink-0 text-muted-foreground" />
              </div>
              {user.phone ? (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {user.phone}
                </div>
              ) : null}
              {user.role === "executor" && user.executor_office_access ? (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {formatExecutorOfficeAccess(user.executor_office_access, offices) ||
                    user.office?.name}
                </div>
              ) : !officeFilterId && user.office?.name ? (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {user.office.name}
                </div>
              ) : null}
              {user.role === "client" ? (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {user.company?.name ?? "Не указана"}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      )}

      <ManagementModalShell
        open={editUser != null}
        onClose={() => !saving && closeEdit()}
        title={editUser?.full_name ?? "Пользователь"}
        maxWidthClass="max-w-lg"
        bodyClassName="max-h-[min(85vh,720px)]"
      >
        {editUser ? (
          <>
            {!isDesktop ? (
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-foreground">{editUser.full_name}</h2>
                  <p className="text-sm text-muted-foreground">{editUserSubtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => !saving && closeEdit()}
                  className="rounded-lg p-2 active:opacity-70"
                  aria-label="Закрыть"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <p className="mb-4 text-sm text-muted-foreground">{editUserSubtitle}</p>
            )}

            <div className="space-y-3">
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

              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Роль</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ROLE_LABELS).map(([id, label]) => (
                    <FilterPill
                      key={id}
                      active={newRole === id}
                      label={label}
                      onClick={() => selectRole(id)}
                    />
                  ))}
                </div>
                {roleError ? <p className="mt-1 text-sm text-destructive">{roleError}</p> : null}
              </div>

              {isExecutorForm && sortedOffices.length > 0 ? (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Офис</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    На заявки каких офисов можно назначать Исполнителя. «Все офисы» включает и
                    новые офисы.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <FilterPill
                      active={draftOfficeAccess.all_offices}
                      label="Все офисы"
                      onClick={() =>
                        setDraftOfficeAccess((prev) =>
                          prev.all_offices
                            ? {
                                all_offices: false,
                                office_ids: draftOfficeId ? [Number(draftOfficeId)] : [],
                              }
                            : { all_offices: true, office_ids: [] },
                        )
                      }
                    />
                    {sortedOffices.map((o) => (
                      <FilterPill
                        key={o.id}
                        active={
                          !draftOfficeAccess.all_offices &&
                          draftOfficeAccess.office_ids.includes(Number(o.id))
                        }
                        label={o.name}
                        onClick={() =>
                          setDraftOfficeAccess((prev) => toggleExecutorOffice(prev, Number(o.id)))
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  {isExecutorForm ? "Основной офис" : "Офис"}
                </p>
                {isExecutorForm ? (
                  <p className="-mt-1 mb-2 text-xs text-muted-foreground">
                    Определяет категории услуг и Офис-менеджера Исполнителя.
                  </p>
                ) : null}
                {["department-head", "manager", "admin-worker"].includes(editUser.role) ? (
                  <p className="text-sm text-muted-foreground">
                    Для пользователей с этой ролью смена офиса здесь недоступна.
                  </p>
                ) : sortedOffices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Список офисов недоступен — обновите экран
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sortedOffices.map((o) => (
                      <FilterPill
                        key={o.id}
                        active={draftOfficeId === String(o.id)}
                        label={o.name}
                        onClick={() => selectDraftOffice(String(o.id))}
                      />
                    ))}
                  </div>
                )}
              </div>

              {newRole === "client"
                ? (() => {
                    const oidNum = draftOfficeId
                      ? Number(draftOfficeId)
                      : editUser.office_id != null
                        ? Number(editUser.office_id)
                        : NaN;
                    const list = Number.isFinite(oidNum)
                      ? (companiesByOfficeId[oidNum] ?? [])
                      : [];
                    return (
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
                          {list.map((c) => (
                            <FilterPill
                              key={c.id}
                              active={draftCompanyId === String(c.id)}
                              label={c.name}
                              onClick={() => setDraftCompanyId(String(c.id))}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()
                : null}

              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван"
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
                    {modalCategories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Нет категорий для офиса пользователя
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {modalCategories.map((c) => (
                          <FilterPill
                            key={c.id}
                            active={selectedCategoryIds.includes(c.id)}
                            label={formatServiceCategoryName(c.name)}
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
                  onClick={handleSaveUser}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center rounded-xl bg-[#F35713] py-3 font-semibold text-white disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </ManagementModalShell>
    </div>
  );
}
