"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Network, Search, ShieldCheck, UserRound, X } from "lucide-react";
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
import {
  DARK_OUTLINE_BUTTON_CLASS,
  EmptyState,
  Segmented,
  StatusBadge,
  Tag,
  formatDateTime,
} from "@/components/org-structure/org-ui";
import { PersonOption, SearchPicker, SelectedChip } from "@/components/org-structure/search-picker";
import { useToast } from "@/hooks/use-toast";
import { fetchOffices } from "@/lib/companies-api";
import {
  getOrgCompany,
  listOrgCompanies,
  type OrgCompanyListItem,
  type OrgDepartment,
} from "@/lib/org-structure-api";
import {
  getUserRecipientAccess,
  listInteractionGroups,
  type InteractionGroup,
  type InteractionGroupFilters,
  type RecipientAccess,
} from "@/lib/task-interaction-groups-api";
import { searchUsersForAssign, type UserSearchItem } from "@/lib/user-search";
import { MemberIcon, memberSubtitle } from "./member-display";

export const INTERACTION_GROUPS_HREF = "/admin-worker/management/interaction-groups";

const ANY = "__any__";

type StatusFilter = "all" | "active" | "inactive";
type PersonRole = "member" | "creator";

async function searchStructureUsers(q: string): Promise<UserSearchItem[]> {
  const res = await searchUsersForAssign(q);
  return res.ok ? res.data.filter((u) => u.company_id != null) : [];
}

/** Список групп взаимодействия по задачам с поиском и фильтрами. */
export function InteractionGroupsListScreen({
  onRegisterHeaderSlot,
}: {
  onRegisterHeaderSlot: (slot: React.ReactNode | null) => void;
}) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<InteractionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [offices, setOffices] = useState<{ id: number; name: string }[]>([]);
  const [officeId, setOfficeId] = useState<string>(ANY);
  const [companies, setCompanies] = useState<OrgCompanyListItem[]>([]);
  const [companyId, setCompanyId] = useState<string>(ANY);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [departmentId, setDepartmentId] = useState<string>(ANY);
  const [person, setPerson] = useState<UserSearchItem | null>(null);
  const [personRole, setPersonRole] = useState<PersonRole>("member");
  const [accessOpen, setAccessOpen] = useState(false);

  useEffect(() => {
    onRegisterHeaderSlot(
      <>
        <Button variant="outline" className={DARK_OUTLINE_BUTTON_CLASS} onClick={() => setAccessOpen(true)}>
          <ShieldCheck className="h-4 w-4" />
          Проверить доступ
        </Button>
        <Button asChild>
          <Link href={`${INTERACTION_GROUPS_HREF}/new`}>Создать группу</Link>
        </Button>
      </>,
    );
    return () => onRegisterHeaderSlot(null);
  }, [onRegisterHeaderSlot]);

  useEffect(() => {
    void fetchOffices().then((res) => {
      if (res.ok) setOffices(res.data.map((o) => ({ id: o.id, name: o.name })));
    });
  }, []);

  useEffect(() => {
    setCompanyId(ANY);
    setCompanies([]);
    if (officeId === ANY) return;
    void listOrgCompanies(Number(officeId), { status: "all" }).then((res) => {
      if (res.ok) setCompanies(res.data.items);
    });
  }, [officeId]);

  useEffect(() => {
    setDepartmentId(ANY);
    setDepartments([]);
    if (companyId === ANY) return;
    void getOrgCompany(Number(companyId)).then((res) => {
      if (res.ok) setDepartments(res.data.departments);
    });
  }, [companyId]);

  const load = useCallback(async () => {
    const filters: InteractionGroupFilters = {
      q: q.trim() || undefined,
      status,
      office_id: officeId !== ANY ? Number(officeId) : undefined,
      company_id: companyId !== ANY ? Number(companyId) : undefined,
      department_id: departmentId !== ANY ? Number(departmentId) : undefined,
      user_id: person && personRole === "member" ? person.id : undefined,
      creator_id: person && personRole === "creator" ? person.id : undefined,
    };
    setLoading(true);
    const res = await listInteractionGroups(filters);
    setLoading(false);
    if (res.ok) setGroups(res.data);
    else toast({ title: res.error, variant: "destructive" });
  }, [q, status, officeId, companyId, departmentId, person, personRole, toast]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), q ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [load, q]);

  const hasFilters =
    q || status !== "all" || officeId !== ANY || companyId !== ANY || departmentId !== ANY || person;

  return (
    <div className="space-y-5 pb-6">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по названию группы или участнику"
              className="pl-9"
            />
          </div>
          <Segmented<StatusFilter>
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "Все" },
              { value: "active", label: "Активные" },
              { value: "inactive", label: "Неактивные" },
            ]}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <FilterSelect label="Офис" value={officeId} onChange={setOfficeId} options={offices} />
          <FilterSelect
            label="Компания"
            value={companyId}
            onChange={setCompanyId}
            options={companies}
            disabled={officeId === ANY}
          />
          <FilterSelect
            label="Отдел"
            value={departmentId}
            onChange={setDepartmentId}
            options={departments}
            disabled={companyId === ANY}
          />
        </div>
        <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Сотрудник</Label>
            {person ? (
              <SelectedChip
                label={person.full_name}
                secondary={person.company?.name}
                onClear={() => setPerson(null)}
              />
            ) : (
              <SearchPicker<UserSearchItem>
                load={searchStructureUsers}
                getKey={(u) => u.id}
                onSelect={setPerson}
                minChars={2}
                placeholder="Поиск сотрудника по имени"
                renderItem={(u) => <PersonOption name={u.full_name} secondary={u.company?.name} />}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Роль сотрудника в группе</Label>
            <Segmented<PersonRole>
              value={personRole}
              onChange={setPersonRole}
              options={[
                { value: "member", label: "Участник" },
                { value: "creator", label: "Постановщик" },
              ]}
            />
          </div>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setStatus("all");
              setOfficeId(ANY);
              setPerson(null);
            }}
            className="inline-flex items-center gap-1 text-sm text-[#F35713] hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Сбросить фильтры
          </button>
        ) : null}
      </div>

      {loading && groups.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#F35713]" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Network className="h-9 w-9 text-[#F35713]" />}
          title={hasFilters ? "Группы не найдены" : "Групп пока нет"}
          text={
            hasFilters
              ? undefined
              : "Без общей группы сотрудники разных компаний не видят друг друга в выборе исполнителя задачи."
          }
          action={
            hasFilters ? undefined : (
              <Button asChild>
                <Link href={`${INTERACTION_GROUPS_HREF}/new`}>Создать группу</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_170px_100px_170px_20px] gap-3 border-b border-border bg-card px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Группа</span>
            <span>Участники</span>
            <span>Постановщики</span>
            <span>Статус</span>
            <span>Изменено</span>
            <span />
          </div>
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`${INTERACTION_GROUPS_HREF}/${g.id}`}
              className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_170px_100px_170px_20px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-white/5"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground">{g.display_name}</span>
                {!g.name ? <span className="text-xs text-muted-foreground">Имя сформировано автоматически</span> : null}
              </span>
              <span className="flex min-w-0 flex-wrap gap-1.5">
                {g.members.slice(0, 4).map((m) => (
                  <span
                    key={`${m.type}-${m.company_id ?? m.department_id ?? m.user_id}`}
                    title={memberSubtitle(m)}
                    className="inline-flex max-w-[200px] items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-foreground"
                  >
                    <MemberIcon type={m.type} className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{m.label}</span>
                  </span>
                ))}
                {g.members.length > 4 ? <Tag>+{g.members.length - 4}</Tag> : null}
              </span>
              <span className="text-sm text-foreground">
                {g.creators_mode === "all" ? "Все участники" : `Только выбранные (${g.creators_count})`}
              </span>
              <StatusBadge active={g.is_active} />
              <span className="min-w-0 text-xs text-muted-foreground">
                <span className="block">{formatDateTime(g.updated_at)}</span>
                <span className="block truncate">{g.updated_by?.full_name ?? "—"}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}

      <AccessCheckDialog open={accessOpen} onClose={() => setAccessOpen(false)} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: number; name: string; is_active?: boolean }[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Любой</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={String(o.id)}>
              {o.name}
              {o.is_active === false ? " (неактивна)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Проверка: кому конкретный пользователь может ставить межкомпанейские задачи. */
function AccessCheckDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [user, setUser] = useState<UserSearchItem | null>(null);
  const [access, setAccess] = useState<RecipientAccess | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setUser(null);
      setAccess(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!user) {
      setAccess(null);
      return;
    }
    setLoading(true);
    void getUserRecipientAccess(user.id).then((res) => {
      setLoading(false);
      if (res.ok) {
        setAccess(res.data);
        setError(null);
      } else setError(res.error);
    });
  }, [user]);

  return (
    <ManagementModalShell open={open} onClose={onClose} title="Проверка доступа к получателям" maxWidthClass="max-w-2xl">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Показывает внешних получателей, которым пользователь может ставить задачи через активные группы.
          Сотрудники своей компании доступны всегда и здесь не перечислены.
        </p>
        {user ? (
          <SelectedChip label={user.full_name} secondary={user.company?.name} onClear={() => setUser(null)} />
        ) : (
          <SearchPicker<UserSearchItem>
            load={searchStructureUsers}
            getKey={(u) => u.id}
            onSelect={setUser}
            minChars={2}
            placeholder="Поиск сотрудника по имени"
            renderItem={(u) => <PersonOption name={u.full_name} secondary={u.company?.name} />}
            autoFocus
          />
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[#F35713]" />
          </div>
        ) : access ? (
          access.can_use_external ? (
            <div className="space-y-4">
              <p className="text-sm text-emerald-400">
                Может ставить задачи через {access.group_ids.length}{" "}
                {access.group_ids.length === 1 ? "группу" : "групп(ы)"}.
              </p>
              <AccessSection
                title="Компании целиком"
                items={access.companies.map((c) => ({ id: c.id, primary: c.name, secondary: c.office?.name }))}
              />
              <AccessSection
                title="Отделы"
                items={access.departments.map((d) => ({ id: d.id, primary: d.name, secondary: d.company?.name }))}
              />
              <AccessSection
                title={`Сотрудники (${access.users.length})`}
                items={access.users.map((u) => ({
                  id: u.id,
                  primary: u.full_name,
                  secondary: [u.company?.name, u.department?.name ?? "Без отдела"].filter(Boolean).join(" · "),
                }))}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <UserRound className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Нет активной группы, дающей право постановки: внешние компании, отделы и сотрудники в поле
                «Исполнитель» не показываются.
              </p>
            </div>
          )
        ) : null}
      </div>
    </ManagementModalShell>
  );
}

function AccessSection({
  title,
  items,
}: {
  title: string;
  items: { id: number; primary: string; secondary?: string | null }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
        {items.map((i) => (
          <div key={i.id} className="border-b border-border px-3 py-2 last:border-b-0">
            <p className="text-sm text-foreground">{i.primary}</p>
            {i.secondary ? <p className="text-xs text-muted-foreground">{i.secondary}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
