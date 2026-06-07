"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useToast } from "@/hooks/use-toast";
import {
  createOfficeCompany,
  deleteOfficeCompany,
  fetchOffices,
  getOfficeCompanies,
  type Company,
  updateOfficeCompany,
} from "@/lib/companies-api";
import { useAuthStore } from "@/stores/useAuthStore";

export type CompaniesManagementVariant = "department-head" | "admin-worker";

function CompaniesHeaderAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-lg active:opacity-70"
      aria-label="Добавить компанию"
    >
      <Plus className="h-7 w-7 text-[#F35713]" />
    </button>
  );
}

type CompaniesManagementScreenProps = {
  variant: CompaniesManagementVariant;
  onRegisterRefresh?: (refetch: () => Promise<void>) => void;
  onRegisterHeaderSlot?: (slot: React.ReactNode | null) => void;
};

/** Управление компаниями офиса — parity с workflow-mobile CompaniesManagementScreen. */
export function CompaniesManagementScreen({
  variant,
  onRegisterRefresh,
  onRegisterHeaderSlot,
}: CompaniesManagementScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const role = useAuthStore((s) => s.role);
  const userOfficeId = useAuthStore((s) => s.user?.office_id);

  const isAdmin = variant === "admin-worker";

  const [offices, setOffices] = useState<{ id: number; name: string }[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
    isAdmin ? "" : String(userOfficeId ?? ""),
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void fetchOffices().then((result) => {
      if (result.ok) setOffices(result.data);
    });
  }, [isAdmin]);

  const manageOfficeId = isAdmin
    ? selectedOfficeId
      ? Number(selectedOfficeId)
      : null
    : userOfficeId != null && userOfficeId > 0
      ? userOfficeId
      : null;

  const allowed =
    (variant === "department-head" && role === "department-head") ||
    (variant === "admin-worker" && role === "admin-worker");

  useEffect(() => {
    if (!allowed) router.back();
  }, [allowed, router]);

  const load = useCallback(async () => {
    if (manageOfficeId == null) {
      setCompanies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getOfficeCompanies(manageOfficeId);
    if (res.ok) setCompanies(res.data);
    else {
      setCompanies([]);
      toast({ title: res.error, variant: "destructive" });
    }
    setLoading(false);
  }, [manageOfficeId, toast]);

  useEffect(() => {
    if (!allowed) return;
    void load();
  }, [allowed, load]);

  useEffect(() => {
    onRegisterRefresh?.(load);
  }, [onRegisterRefresh, load]);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setFormName("");
    setSaveError(null);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if (!onRegisterHeaderSlot) return;
    if (manageOfficeId == null) {
      onRegisterHeaderSlot(null);
      return;
    }
    onRegisterHeaderSlot(<CompaniesHeaderAddButton onClick={openCreate} />);
    return () => onRegisterHeaderSlot(null);
  }, [onRegisterHeaderSlot, manageOfficeId, openCreate]);

  const openEdit = (company: Company) => {
    setEditingId(company.id);
    setFormName(company.name);
    setSaveError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setSaveError(null);
  };

  const handleSubmit = async () => {
    if (manageOfficeId == null) return;
    const name = formName.trim();
    if (!name) {
      setSaveError("Введите название компании");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res =
        editingId == null
          ? await createOfficeCompany(manageOfficeId, { name })
          : await updateOfficeCompany(manageOfficeId, editingId, { name });
      if (!res.ok) {
        setSaveError(res.error);
        return;
      }
      toast({ title: editingId == null ? "Компания добавлена" : "Сохранено" });
      closeModal();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || manageOfficeId == null) return;
    setIsDeleting(true);
    const res = await deleteOfficeCompany(manageOfficeId, deleteTarget.id);
    setIsDeleting(false);
    if (!res.ok) {
      toast({ title: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено" });
    setDeleteTarget(null);
    await load();
  };

  if (!allowed) return null;

  const needsPickOffice = isAdmin && manageOfficeId == null;
  const noOfficeAccount = !isAdmin && manageOfficeId == null;

  const formSheet =
    modalOpen && portalReady ? (
      <div className="fixed inset-0 z-[200] flex flex-col justify-end">
        <button
          type="button"
          className="absolute inset-0 bg-black/45"
          onClick={() => !saving && closeModal()}
          aria-label="Закрыть"
        />
        <div className="relative rounded-t-2xl border-t border-border bg-card px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base font-bold text-foreground">
              {editingId == null ? "Новая компания" : "Редактировать компанию"}
            </p>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Название</Label>
              <Input
                id="company-name"
                placeholder="Например, TOO TMK Limited"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                maxLength={255}
                disabled={saving}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && formName.trim()) void handleSubmit();
                }}
              />
            </div>
            {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
            <Button
              className="w-full"
              onClick={() => void handleSubmit()}
              disabled={saving || !formName.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : editingId == null ? (
                "Создать"
              ) : (
                "Сохранить"
              )}
            </Button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-6">
      {isAdmin ? (
        <div className="mb-4">
          <Select value={selectedOfficeId || undefined} onValueChange={setSelectedOfficeId}>
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
      ) : null}

      {noOfficeAccount ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-foreground">Нет офиса</p>
          <p className="text-sm text-muted-foreground">
            Свяжитесь с администратором, чтобы получить офис.
          </p>
        </div>
      ) : needsPickOffice ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <Building2 className="h-9 w-9 text-muted-foreground" />
          <p className="text-lg font-semibold text-foreground">Выберите офис</p>
          <p className="text-sm text-muted-foreground">
            Чтобы увидеть и редактировать компании, выберите офис из списка выше.
          </p>
        </div>
      ) : loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#F35713]" />
        </div>
      ) : companies.length === 0 ? (
        <button
          type="button"
          onClick={openCreate}
          className="w-full rounded-2xl border border-border bg-card p-6 text-center active:opacity-90"
        >
          <Building2 className="mx-auto h-8 w-8 text-[#F35713]" />
          <p className="mt-3 text-base font-semibold text-foreground">Добавить первую компанию</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Клиенты выберут компанию при регистрации.
          </p>
        </button>
      ) : (
        <div className="space-y-2">
          {companies.map((company) => (
            <div
              key={company.id}
              className="flex items-center rounded-xl border border-border bg-card pr-3"
            >
              <button
                type="button"
                onClick={() => openEdit(company)}
                className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left active:opacity-80"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(243,87,19,0.2)]">
                  <Building2 className="h-5 w-5 text-[#F35713]" />
                </div>
                <p className="truncate text-base font-semibold text-foreground">{company.name}</p>
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(company)}
                  className="p-2 active:opacity-70"
                  aria-label="Удалить компанию"
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </button>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {portalReady && formSheet ? createPortal(formSheet, document.body) : null}

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить компанию?</AlertDialogTitle>
            <AlertDialogDescription>
              Все клиенты, привязанные к «{deleteTarget?.name}», увидят значение «Не указана».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
