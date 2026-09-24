"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, History, Loader2, Plus, Power, Trash2, Users } from "lucide-react";
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
import { ConfirmDialog, LogDialog } from "@/components/org-structure/org-dialogs";
import {
  DARK_OUTLINE_BUTTON_CLASS,
  Segmented,
  StatusBadge,
  Tag,
  formatDateTime,
} from "@/components/org-structure/org-ui";
import { PersonOption, SearchPicker } from "@/components/org-structure/search-picker";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fetchOffices } from "@/lib/companies-api";
import {
  getOrgCompany,
  listOrgCompanies,
  listOrgEmployees,
  type OrgCompanyListItem,
  type OrgDepartment,
  type OrgEmployee,
} from "@/lib/org-structure-api";
import { describeGroupLog } from "@/lib/org-structure-log-format";
import {
  createInteractionGroup,
  listInteractionGroupLogs,
  setInteractionGroupActive,
  updateInteractionGroup,
  type CreatorsMode,
  type InteractionGroup,
  type InteractionMemberInput,
  type InteractionMemberType,
} from "@/lib/task-interaction-groups-api";
import { INTERACTION_GROUPS_HREF } from "./interaction-groups-list-screen";
import { MEMBER_TYPE_LABEL, MemberIcon } from "./member-display";

type DraftMember = {
  key: string;
  type: InteractionMemberType;
  id: number;
  /** Компания участника — нужна для разворачивания в сотрудников. */
  companyId: number | null;
  label: string;
  context: string;
  isActive: boolean;
};

type Person = { id: number; full_name: string; position?: string | null; company: string | null };

function memberKey(type: InteractionMemberType, id: number) {
  return `${type[0]}:${id}`;
}

function draftFromGroup(group: InteractionGroup): DraftMember[] {
  return group.members.map((m) => {
    const id = (m.type === "company" ? m.company_id : m.type === "department" ? m.department_id : m.user_id) ?? 0;
    const context = [m.type !== "company" ? m.company?.name : null, m.office?.name].filter(Boolean).join(" · ");
    return {
      key: memberKey(m.type, id),
      type: m.type,
      id,
      companyId: m.company?.id ?? null,
      label: m.label,
      context,
      isActive: m.is_active,
    };
  });
}

function toInput(m: DraftMember): InteractionMemberInput {
  if (m.type === "company") return { type: "company", company_id: m.id };
  if (m.type === "department") return { type: "department", department_id: m.id };
  return { type: "user", user_id: m.id };
}

/** Создание / редактирование группы взаимодействия. group = null — новая группа. */
export function InteractionGroupEditor({
  group,
  onGroupChange,
}: {
  group: InteractionGroup | null;
  onGroupChange?: (group: InteractionGroup) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isNew = group == null;

  const [name, setName] = useState(group?.name ?? "");
  const [members, setMembers] = useState<DraftMember[]>(() => (group ? draftFromGroup(group) : []));
  const [mode, setMode] = useState<CreatorsMode>(group?.creators_mode ?? "all");
  const [creators, setCreators] = useState<Person[]>(
    () =>
      group?.creators.map((c) => ({
        id: c.user_id,
        full_name: c.full_name,
        position: c.position,
        company: c.company?.name ?? null,
      })) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<number | null>(null);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  // Эффективные участники (для выбора постановщиков) — разворачиваем компании/отделы в сотрудников
  const employeesCache = useRef(new Map<number, OrgEmployee[]>());
  const [effective, setEffective] = useState<Person[]>([]);
  const [effectiveLoading, setEffectiveLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const companyIds = Array.from(
      new Set(members.filter((m) => m.type !== "user" && m.companyId != null).map((m) => m.companyId as number)),
    );
    setEffectiveLoading(true);
    void Promise.all(
      companyIds.map(async (cid) => {
        if (!employeesCache.current.has(cid)) {
          const res = await listOrgEmployees(cid);
          employeesCache.current.set(cid, res.ok ? res.data : []);
        }
      }),
    ).then(() => {
      if (cancelled) return;
      const map = new Map<number, Person>();
      for (const m of members) {
        if (m.type === "user") {
          map.set(m.id, { id: m.id, full_name: m.label, company: m.context.split(" · ")[0] || null });
          continue;
        }
        const list = m.companyId != null ? employeesCache.current.get(m.companyId) ?? [] : [];
        const companyName = m.type === "company" ? m.label : m.context.split(" · ")[0] || null;
        for (const e of list) {
          if (m.type === "department" && e.department_id !== m.id) continue;
          map.set(e.id, { id: e.id, full_name: e.full_name, position: e.position, company: companyName });
        }
      }
      setEffective(Array.from(map.values()).sort((a, b) => a.full_name.localeCompare(b.full_name, "ru")));
      setEffectiveLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [members]);

  const effectiveIds = useMemo(() => new Set(effective.map((p) => p.id)), [effective]);
  const autoName = useMemo(() => {
    const labels = members.map((m) => (m.type === "department" && m.context ? `${m.context.split(" · ")[0]} · ${m.label}` : m.label));
    return labels.length <= 3 ? labels.join(" ↔ ") : `${labels.slice(0, 3).join(" ↔ ")} и ещё ${labels.length - 3}`;
  }, [members]);

  const addMember = (m: DraftMember) => {
    setMembers((prev) => (prev.some((p) => p.key === m.key) ? prev : [...prev, m]));
    setDuplicateId(null);
  };
  const removeMember = (key: string) => {
    setMembers((prev) => prev.filter((m) => m.key !== key));
    setDuplicateId(null);
  };

  const canSave = members.length >= 2 && (mode === "all" || creators.length > 0) && !saving;

  const save = async () => {
    setSaving(true);
    setError(null);
    setDuplicateId(null);
    const body = {
      name: name.trim() || null,
      members: members.map(toInput),
      creators_mode: mode,
      creator_ids: mode === "selected" ? creators.map((c) => c.id) : [],
    };
    const res = isNew ? await createInteractionGroup(body) : await updateInteractionGroup(group.id, body);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      setDuplicateId(res.duplicateGroupId ?? null);
      return;
    }
    toast({ title: isNew ? "Группа создана" : "Изменения сохранены" });
    if (isNew) router.replace(`${INTERACTION_GROUPS_HREF}/${res.data.id}`);
    else onGroupChange?.(res.data);
  };

  const fetchLogs = useCallback(
    (page: number) => listInteractionGroupLogs(group?.id ?? 0, { page, limit: 30 }),
    [group?.id],
  );

  const creatorsOutsideGroup = creators.filter((c) => !effectiveLoading && !effectiveIds.has(c.id));

  return (
    <div className="grid gap-5 pb-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <section className="space-y-2 rounded-2xl border border-border bg-card p-5">
          <Label htmlFor="group-name">Название группы (необязательно)</Label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={autoName || "Сформируется автоматически из участников"}
            maxLength={255}
          />
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Участники</h3>
            <p className="text-sm text-muted-foreground">
              Компания и отдел работают динамически: новые сотрудники входят в группу автоматически.
            </p>
          </div>
          {members.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Добавьте минимум двух участников ниже
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              {members.map((m) => (
                <div key={m.key} className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <MemberIcon type={m.type} className="h-4 w-4 text-[#F35713]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{m.label}</p>
                      <Tag>{MEMBER_TYPE_LABEL[m.type]}</Tag>
                      {!m.isActive ? <Tag>Неактивен — прав не даёт</Tag> : null}
                    </div>
                    {m.context ? <p className="truncate text-xs text-muted-foreground">{m.context}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(m.key)}
                    className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                    aria-label="Удалить участника"
                    title="Удалить участника"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <AddMemberPanel existingKeys={new Set(members.map((m) => m.key))} onAdd={addMember} />
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Кто может ставить задачи через группу</h3>
            <p className="text-sm text-muted-foreground">
              Группа влияет только на выбор получателей при создании задачи. Внутри своей компании задачи ставятся
              без групп.
            </p>
          </div>
          <Segmented<CreatorsMode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "all", label: "Все участники" },
              { value: "selected", label: "Только выбранные сотрудники" },
            ]}
          />
          {mode === "all" ? (
            <p className="text-sm text-muted-foreground">
              Любой эффективный участник группы может ставить задачи другим участникам.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Только выбранные сотрудники инициируют задачи; остальные участники только получают их. Если
                постановщики есть лишь с одной стороны — связь фактически односторонняя. Новые сотрудники
                компании/отдела постановщиками автоматически не становятся.
              </p>
              {creators.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {creators.map((c) => (
                    <span
                      key={c.id}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
                        effectiveIds.has(c.id) || effectiveLoading
                          ? "border-border bg-white/5 text-foreground"
                          : "border-destructive/50 text-destructive",
                      )}
                    >
                      {c.full_name}
                      {c.company ? <span className="text-xs text-muted-foreground">{c.company}</span> : null}
                      <button
                        type="button"
                        onClick={() => setCreators((prev) => prev.filter((p) => p.id !== c.id))}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Убрать постановщика"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-destructive">Выберите минимум одного постановщика.</p>
              )}
              {creatorsOutsideGroup.length > 0 ? (
                <p className="text-xs text-destructive">
                  Выделенные сотрудники больше не входят в участников группы и не могут ставить задачи через неё.
                </p>
              ) : null}
              <SearchPicker<Person>
                load={async (q) => {
                  const s = q.toLowerCase();
                  return effective.filter((p) => p.full_name.toLowerCase().includes(s)).slice(0, 30);
                }}
                getKey={(p) => p.id}
                onSelect={(p) => setCreators((prev) => (prev.some((c) => c.id === p.id) ? prev : [...prev, p]))}
                isItemDisabled={(p) => creators.some((c) => c.id === p.id)}
                minChars={0}
                refreshKey={effective}
                placeholder={
                  effectiveLoading ? "Загрузка участников…" : `Поиск среди участников группы (${effective.length})`
                }
                emptyText={members.length === 0 ? "Сначала добавьте участников" : "Никого не найдено"}
                renderItem={(p) => (
                  <PersonOption name={p.full_name} secondary={[p.company, p.position].filter(Boolean).join(" · ")} />
                )}
                disabled={effectiveLoading}
              />
            </div>
          )}
        </section>

        {error ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="space-y-1 text-sm">
              <p className="text-foreground">{error}</p>
              {duplicateId ? (
                <Link href={`${INTERACTION_GROUPS_HREF}/${duplicateId}`} className="text-[#F35713] hover:underline">
                  Открыть существующую группу
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void save()} disabled={!canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isNew ? "Создать группу" : "Сохранить изменения"}
          </Button>
          <Button variant="outline" className={DARK_OUTLINE_BUTTON_CLASS} asChild>
            <Link href={INTERACTION_GROUPS_HREF}>Отмена</Link>
          </Button>
        </div>
      </div>

      <aside className="space-y-3 self-start xl:sticky xl:top-6">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Статус</span>
            {group ? <StatusBadge active={group.is_active} /> : <Tag>Будет активна</Tag>}
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Эффективных участников
            </span>
            <span className="text-sm font-semibold text-foreground">
              {effectiveLoading ? "…" : effective.length}
            </span>
          </div>
          {group ? (
            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              Изменено {formatDateTime(group.updated_at)}
              <br />
              {group.updated_by?.full_name ?? "—"}
            </div>
          ) : null}
        </div>
        {group ? (
          <>
            <Button variant="outline" className={cn("w-full", DARK_OUTLINE_BUTTON_CLASS)} onClick={() => setLogOpen(true)}>
              <History className="h-4 w-4" />
              Журнал изменений
            </Button>
            <Button variant="outline" className={cn("w-full", DARK_OUTLINE_BUTTON_CLASS)} onClick={() => setConfirmToggle(true)}>
              <Power className="h-4 w-4" />
              {group.is_active ? "Деактивировать группу" : "Активировать группу"}
            </Button>
            <ConfirmDialog
              open={confirmToggle}
              title={group.is_active ? "Деактивировать группу?" : "Активировать группу?"}
              description={
                group.is_active
                  ? "Группа перестанет давать права для новых межкомпанейских задач. Уже созданные задачи и их история не изменятся."
                  : "Участники снова смогут ставить задачи через эту группу по её правилам."
              }
              confirmLabel={group.is_active ? "Деактивировать" : "Активировать"}
              destructive={group.is_active}
              onClose={() => setConfirmToggle(false)}
              onConfirm={async () => {
                const res = await setInteractionGroupActive(group.id, !group.is_active);
                if (!res.ok) {
                  toast({ title: res.error, variant: "destructive" });
                  return;
                }
                onGroupChange?.(res.data);
                setConfirmToggle(false);
                toast({ title: res.data.is_active ? "Группа активирована" : "Группа деактивирована" });
              }}
            />
            <LogDialog
              open={logOpen}
              title={`Журнал изменений · ${group.display_name}`}
              fetchPage={fetchLogs}
              describe={describeGroupLog}
              onClose={() => setLogOpen(false)}
            />
          </>
        ) : null}
      </aside>
    </div>
  );
}

type Level = "company" | "department" | "user";

/** Добавление участника: офис → компания → уровень (вся компания / отдел / сотрудник). */
function AddMemberPanel({
  existingKeys,
  onAdd,
}: {
  existingKeys: Set<string>;
  onAdd: (member: DraftMember) => void;
}) {
  const [offices, setOffices] = useState<{ id: number; name: string }[]>([]);
  const [officeId, setOfficeId] = useState<string>("");
  const [companies, setCompanies] = useState<OrgCompanyListItem[]>([]);
  const [company, setCompany] = useState<OrgCompanyListItem | null>(null);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [level, setLevel] = useState<Level>("company");

  const office = offices.find((o) => String(o.id) === officeId) ?? null;

  useEffect(() => {
    void fetchOffices().then((res) => {
      if (res.ok) setOffices(res.data.map((o) => ({ id: o.id, name: o.name })));
    });
  }, []);

  useEffect(() => {
    setCompany(null);
    setCompanies([]);
    if (!officeId) return;
    void listOrgCompanies(Number(officeId), { status: "active" }).then((res) => {
      if (res.ok) setCompanies(res.data.items);
    });
  }, [officeId]);

  useEffect(() => {
    setDepartments([]);
    setLevel("company");
    if (!company) return;
    void getOrgCompany(company.id).then((res) => {
      if (res.ok) setDepartments(res.data.departments.filter((d) => d.is_active));
    });
  }, [company]);

  const context = (withCompany: boolean) =>
    [withCompany ? company?.name : null, office?.name].filter(Boolean).join(" · ");

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Plus className="h-4 w-4 text-[#F35713]" />
        Добавить участника
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">1. Офис</Label>
          <Select value={officeId || undefined} onValueChange={setOfficeId}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите офис" />
            </SelectTrigger>
            <SelectContent>
              {offices.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">2. Компания</Label>
          {company ? (
            <div className="flex h-10 items-center justify-between rounded-md border border-border px-3 text-sm">
              <span className="truncate text-foreground">{company.name}</span>
              <button type="button" onClick={() => setCompany(null)} className="text-xs text-[#F35713] hover:underline">
                Изменить
              </button>
            </div>
          ) : (
            <SearchPicker<OrgCompanyListItem>
              load={async (q) => {
                const s = q.toLowerCase();
                return companies.filter((c) => c.name.toLowerCase().includes(s));
              }}
              getKey={(c) => c.id}
              onSelect={setCompany}
              minChars={0}
              refreshKey={companies}
              disabled={!officeId}
              placeholder={officeId ? "Поиск компании по названию" : "Сначала выберите офис"}
              emptyText="Активных компаний не найдено"
              renderItem={(c) => (
                <PersonOption name={c.name} secondary={`${c.employees_count} сотр. · ${c.departments_count} отд.`} />
              )}
            />
          )}
        </div>
      </div>

      {company ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">3. Уровень участия</Label>
            <Segmented<Level>
              value={level}
              onChange={setLevel}
              options={[
                { value: "company", label: "Вся компания" },
                { value: "department", label: "Отдел" },
                { value: "user", label: "Сотрудник" },
              ]}
            />
          </div>
          {level === "company" ? (
            <Button
              size="sm"
              disabled={existingKeys.has(memberKey("company", company.id))}
              onClick={() =>
                onAdd({
                  key: memberKey("company", company.id),
                  type: "company",
                  id: company.id,
                  companyId: company.id,
                  label: company.name,
                  context: context(false),
                  isActive: true,
                })
              }
            >
              {existingKeys.has(memberKey("company", company.id)) ? "Уже в группе" : `Добавить «${company.name}» целиком`}
            </Button>
          ) : level === "department" ? (
            <SearchPicker<OrgDepartment>
              load={async (q) => {
                const s = q.toLowerCase();
                return departments.filter((d) => d.name.toLowerCase().includes(s));
              }}
              getKey={(d) => d.id}
              minChars={0}
              refreshKey={departments}
              isItemDisabled={(d) => existingKeys.has(memberKey("department", d.id))}
              onSelect={(d) =>
                onAdd({
                  key: memberKey("department", d.id),
                  type: "department",
                  id: d.id,
                  companyId: company.id,
                  label: d.name,
                  context: context(true),
                  isActive: true,
                })
              }
              placeholder="Поиск отдела по названию"
              emptyText="Активных отделов нет"
              renderItem={(d) => <PersonOption name={d.name} secondary={`${d.employees_count} сотр.`} />}
            />
          ) : (
            <SearchPicker<OrgEmployee>
              load={async (q) => {
                const res = await listOrgEmployees(company.id, { q });
                return res.ok ? res.data : [];
              }}
              getKey={(u) => u.id}
              isItemDisabled={(u) => existingKeys.has(memberKey("user", u.id))}
              onSelect={(u) =>
                onAdd({
                  key: memberKey("user", u.id),
                  type: "user",
                  id: u.id,
                  companyId: company.id,
                  label: u.full_name,
                  context: context(true),
                  isActive: true,
                })
              }
              placeholder="Поиск сотрудника по имени"
              renderItem={(u) => (
                <PersonOption name={u.full_name} secondary={[u.position, u.department?.name ?? "Без отдела"].filter(Boolean).join(" · ")} />
              )}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
