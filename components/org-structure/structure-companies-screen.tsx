"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Building2, ChevronRight, Loader2, Plus, Search, Users } from "lucide-react";
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
import { fetchOffices } from "@/lib/companies-api";
import {
  createOrgCompany,
  listOrgCompanies,
  searchOfficeFreeUsers,
  type CompanyStatusFilter,
  type OrgCandidate,
  type OrgCompanyListItem,
} from "@/lib/org-structure-api";
import { EmptyState, Segmented, StatusBadge } from "./org-ui";
import { PersonOption, SearchPicker, SelectedChip } from "./search-picker";

export const STRUCTURE_BASE_HREF = "/admin-worker/management/structure";

const STATUS_OPTIONS: { value: CompanyStatusFilter; label: string }[] = [
  { value: "active", label: "Активные" },
  { value: "inactive", label: "Неактивные" },
  { value: "all", label: "Все" },
];

/** Раздел «Структура»: выбор офиса → компании офиса. */
export function StructureCompaniesScreen({
  onRegisterHeaderSlot,
}: {
  onRegisterHeaderSlot: (slot: React.ReactNode | null) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const officeParam = searchParams.get("office");
  const officeId = officeParam && Number(officeParam) > 0 ? Number(officeParam) : null;

  const [offices, setOffices] = useState<{ id: number; name: string }[]>([]);
  const [status, setStatus] = useState<CompanyStatusFilter>("active");
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<OrgCompanyListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void fetchOffices().then((res) => {
      if (res.ok) setOffices(res.data.map((o) => ({ id: o.id, name: o.name })));
    });
  }, []);

  const load = useCallback(async () => {
    if (officeId == null) {
      setCompanies([]);
      return;
    }
    setLoading(true);
    const res = await listOrgCompanies(officeId, { status, q: query.trim() || undefined });
    setLoading(false);
    if (res.ok) setCompanies(res.data.items);
    else {
      setCompanies([]);
      toast({ title: res.error, variant: "destructive" });
    }
  }, [officeId, status, query, toast]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), query ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [load, query]);

  useEffect(() => {
    if (officeId == null) {
      onRegisterHeaderSlot(null);
      return;
    }
    onRegisterHeaderSlot(
      <Button onClick={() => setCreateOpen(true)}>
        <Plus className="h-4 w-4" />
        Добавить компанию
      </Button>,
    );
    return () => onRegisterHeaderSlot(null);
  }, [officeId, onRegisterHeaderSlot]);

  const selectOffice = (value: string) => {
    setQuery("");
    router.replace(`${STRUCTURE_BASE_HREF}?office=${value}`);
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="max-w-md space-y-2">
        <Label>Офис</Label>
        <Select value={officeId != null ? String(officeId) : undefined} onValueChange={selectOffice}>
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

      {officeId == null ? (
        <EmptyState
          icon={<Building2 className="h-9 w-9 text-muted-foreground" />}
          title="Выберите офис"
          text="Структура строится внутри офиса: сначала офис, затем компания и её отделы."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск компании по названию"
                className="pl-9"
              />
            </div>
            <Segmented value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          </div>

          {loading && companies.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#F35713]" />
            </div>
          ) : companies.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-9 w-9 text-[#F35713]" />}
              title={query ? "Ничего не найдено" : status === "inactive" ? "Нет неактивных компаний" : "Компаний пока нет"}
              text={query || status === "inactive" ? undefined : "Добавьте первую компанию этого офиса."}
              action={
                !query && status !== "inactive" ? (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Добавить компанию
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_110px_110px_110px_24px] gap-3 border-b border-border bg-card px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Компания</span>
                <span>Руководитель</span>
                <span>Отделов</span>
                <span>Сотрудников</span>
                <span>Статус</span>
                <span />
              </div>
              {companies.map((c) => (
                <Link
                  key={c.id}
                  href={`${STRUCTURE_BASE_HREF}/${c.id}`}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_110px_110px_110px_24px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-white/5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(243,87,19,0.2)]">
                      <Building2 className="h-4 w-4 text-[#F35713]" />
                    </span>
                    <span className="truncate font-semibold text-foreground">{c.name}</span>
                  </span>
                  <span className="truncate text-sm text-muted-foreground">{c.head?.full_name ?? "—"}</span>
                  <span className="text-sm text-foreground">{c.departments_count}</span>
                  <span className="flex items-center gap-1.5 text-sm text-foreground">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.employees_count}
                  </span>
                  <StatusBadge active={c.is_active} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {officeId != null ? (
        <CreateCompanyModal
          open={createOpen}
          officeId={officeId}
          officeName={offices.find((o) => o.id === officeId)?.name}
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => {
            setCreateOpen(false);
            toast({ title: "Компания создана" });
            router.push(`${STRUCTURE_BASE_HREF}/${id}`);
          }}
        />
      ) : null}
    </div>
  );
}

function CreateCompanyModal({
  open,
  officeId,
  officeName,
  onClose,
  onCreated,
}: {
  open: boolean;
  officeId: number;
  officeName?: string;
  onClose: () => void;
  onCreated: (companyId: number) => void;
}) {
  const [name, setName] = useState("");
  const [head, setHead] = useState<OrgCandidate | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setHead(null);
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Введите название компании");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await createOrgCompany(officeId, { name: name.trim(), head_user_id: head?.id ?? null });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onCreated(res.data.id);
  };

  return (
    <ManagementModalShell open={open} onClose={() => !saving && onClose()} title="Новая компания">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Офис</Label>
          <Input value={officeName ?? `Офис #${officeId}`} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-company-name">Название компании</Label>
          <Input
            id="org-company-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, TMK"
            maxLength={255}
            disabled={saving}
          />
        </div>
        <div className="space-y-2">
          <Label>Руководитель компании (необязательно)</Label>
          {head ? (
            <SelectedChip
              label={head.full_name}
              secondary={head.position ?? head.phone}
              onClear={() => setHead(null)}
              disabled={saving}
            />
          ) : (
            <>
              <SearchPicker<OrgCandidate>
                load={(q) => searchOfficeFreeUsers(officeId, q)}
                getKey={(u) => u.id}
                onSelect={setHead}
                placeholder="Поиск по имени или телефону"
                renderItem={(u) => <PersonOption name={u.full_name} secondary={u.position ?? u.phone} />}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Выбранный пользователь будет добавлен в компанию («Без отдела»). Метка информационная и не
                даёт дополнительных прав.
              </p>
            </>
          )}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={() => void submit()} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Создать
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
        </div>
      </div>
    </ManagementModalShell>
  );
}
