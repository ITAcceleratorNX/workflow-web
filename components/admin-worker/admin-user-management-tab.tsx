"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  Filter,
  Loader2,
  Phone,
  Search,
  Users,
} from "lucide-react";
import {
  FilterPill,
  USER_ROLE_LABELS as ROLE_LABELS,
  UserEditModal,
} from "@/components/admin-worker/management/users/user-edit-modal";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@/lib/companies-api";
import { getOfficeCompanies } from "@/lib/companies-api";
import type { Office, ServiceCategory } from "@/lib/service-categories-api";
import {
  getExecutors,
  getUsersForManagement,
  type ExecutorInCategory,
  type OfficeUser,
} from "@/lib/users-management-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatExecutorOfficeAccess } from "@/lib/executor-office-access";

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
  const [companyFilterId, setCompanyFilterId] = useState("");
  const [companiesByOfficeId, setCompaniesByOfficeId] = useState<Record<number, Company[]>>({});

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
      toast({ title: "Ошибка", description: usersRes.error, variant: "error" });
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

  const openEdit = (user: OfficeUser) => setEditUser(user);

  const companyFilterList = (() => {
    const oid = officeFilterId
      ? Number(officeFilterId)
      : authOfficeId
        ? Number(authOfficeId)
        : NaN;
    return Number.isFinite(oid) ? (companiesByOfficeId[oid] ?? []) : [];
  })();

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

      <UserEditModal
        user={editUser}
        scope="admin"
        offices={offices}
        categories={categories}
        executor={editUser ? executorByUserId[editUser.id] : undefined}
        onExecutorLoaded={(userId, executor) =>
          setExecutorByUserId((prev) => ({ ...prev, [userId]: executor }))
        }
        companiesByOfficeId={companiesByOfficeId}
        onNeedCompanies={(officeId) => void loadCompaniesForOffice(officeId)}
        onClose={() => setEditUser(null)}
        onSaved={() => void loadUsers()}
      />
    </div>
  );
}
