"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Edit, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import {
  ManagementAlertDialogCancel,
  ManagementAlertDialogContent,
  ManagementAlertDialogDescription,
  ManagementAlertDialogTitle,
} from "@/components/layout/management-alert-dialog";
import { formatServiceCategoryDisplayName } from "@/constants/requests";
import { useToast } from "@/hooks/use-toast";
import { formatRequestDate } from "@/lib/dateTimeUtils";
import type { Office } from "@/lib/service-categories-api";
import {
  approveRegistrationRequest,
  deleteRejectedRegistrationRequest,
  getRegistrationRequests,
  rejectRegistrationRequest,
  type RegistrationRequestItem,
} from "@/lib/registration-requests-api";
import { RegistrationRequestEditSheet } from "./registration-request-edit-sheet";

const ROLE_LABELS: Record<string, string> = {
  client: "Клиент",
  "admin-worker": "Администратор офиса",
  "department-head": "Офис менеджер",
  executor: "Исполнитель",
  manager: "Руководитель",
};

const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  approved: "Одобрено",
  rejected: "Отклонено",
};

type AdminRegistrationRequestsTabProps = {
  offices: Office[];
  isActive: boolean;
  onRegisterRefresh?: (refetch: () => Promise<void>) => void;
};

export function AdminRegistrationRequestsTab({
  offices,
  isActive,
  onRegisterRefresh,
}: AdminRegistrationRequestsTabProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RegistrationRequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", date_from: "", date_to: "" });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showOfficeDropdown, setShowOfficeDropdown] = useState(false);
  const [actionRequestId, setActionRequestId] = useState<number | null>(null);
  const [editingRequest, setEditingRequest] = useState<RegistrationRequestItem | null>(null);
  const [filterOfficeId, setFilterOfficeId] = useState("");
  const [requestPage, setRequestPage] = useState(1);
  const [requestMeta, setRequestMeta] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    const params: {
      status?: string;
      date_from?: string;
      date_to?: string;
      office_id?: string;
      page?: string;
      page_size?: string;
    } = {
      page: String(requestPage),
      page_size: "20",
    };
    if (filters.status) params.status = filters.status;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filterOfficeId) params.office_id = filterOfficeId;

    const result = await getRegistrationRequests(params);
    if (result.ok) {
      setRequests(result.data);
      setRequestMeta(result.meta);
    } else {
      setRequests([]);
      setRequestMeta({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
    }
    setRequestsLoading(false);
  }, [filters.status, filters.date_from, filters.date_to, filterOfficeId, requestPage]);

  useEffect(() => {
    if (!isActive) return;
    loadRequests();
  }, [isActive, loadRequests]);

  useEffect(() => {
    onRegisterRefresh?.(loadRequests);
  }, [onRegisterRefresh, loadRequests]);

  const handleApprove = useCallback(
    async (requestId: number) => {
      setActionRequestId(requestId);
      const result = await approveRegistrationRequest(requestId);
      if (result.ok) {
        toast({
          title: "Успешно",
          description: "Запрос одобрен, пользователь создан",
        });
        loadRequests();
      } else {
        toast({ title: "Ошибка", description: result.error, variant: "destructive" });
      }
      setActionRequestId(null);
    },
    [toast, loadRequests],
  );

  const handleReject = useCallback(
    async (requestId: number) => {
      setActionRequestId(requestId);
      const result = await rejectRegistrationRequest(requestId);
      if (result.ok) {
        toast({ title: "Успешно", description: "Запрос отклонён" });
        loadRequests();
      } else {
        toast({ title: "Ошибка", description: result.error, variant: "destructive" });
      }
      setActionRequestId(null);
    },
    [toast, loadRequests],
  );

  const handleDeleteRejected = useCallback(
    async (requestId: number) => {
      setActionRequestId(requestId);
      const result = await deleteRejectedRegistrationRequest(requestId);
      if (result.ok) {
        toast({ title: "Удалено", description: "Отклонённый запрос удалён из списка" });
        loadRequests();
      } else {
        toast({ title: "Ошибка", description: result.error, variant: "destructive" });
      }
      setActionRequestId(null);
      setDeleteConfirmId(null);
    },
    [toast, loadRequests],
  );

  const registrationOfficeLabel = useMemo(() => {
    if (!filterOfficeId) return "Все офисы";
    return offices.find((o) => String(o.id) === filterOfficeId)?.name ?? "Офис";
  }, [filterOfficeId, offices]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Управление запросами на регистрацию
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Отклонённые и одобренные заявки автоматически удаляются каждые 7 дней
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Офис</label>
        <button
          type="button"
          onClick={() => {
            setShowOfficeDropdown((v) => !v);
            setShowStatusDropdown(false);
          }}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left"
        >
          <span className="text-foreground">{registrationOfficeLabel}</span>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform ${showOfficeDropdown ? "rotate-180" : ""}`}
          />
        </button>
        {showOfficeDropdown ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              type="button"
              className={`w-full px-4 py-3 text-left text-foreground ${!filterOfficeId ? "bg-[rgba(243,87,19,0.12)]" : ""}`}
              onClick={() => {
                setFilterOfficeId("");
                setRequestPage(1);
                setShowOfficeDropdown(false);
              }}
            >
              Все офисы
            </button>
            {offices.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`w-full px-4 py-3 text-left text-foreground ${filterOfficeId === String(o.id) ? "bg-[rgba(243,87,19,0.12)]" : ""}`}
                onClick={() => {
                  setFilterOfficeId(String(o.id));
                  setRequestPage(1);
                  setShowOfficeDropdown(false);
                }}
              >
                {o.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Статус</label>
        <button
          type="button"
          onClick={() => {
            setShowStatusDropdown((v) => !v);
            setShowOfficeDropdown(false);
          }}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left"
        >
          <span className="text-foreground">
            {filters.status
              ? (REGISTRATION_STATUS_LABELS[filters.status] ?? filters.status)
              : "Все статусы"}
          </span>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform ${showStatusDropdown ? "rotate-180" : ""}`}
          />
        </button>
        {showStatusDropdown ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              type="button"
              className={`w-full px-4 py-3 text-left text-foreground ${!filters.status ? "bg-[rgba(243,87,19,0.12)]" : ""}`}
              onClick={() => {
                setFilters((f) => ({ ...f, status: "" }));
                setRequestPage(1);
                setShowStatusDropdown(false);
              }}
            >
              Все статусы
            </button>
            {(["pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`w-full px-4 py-3 text-left text-foreground ${filters.status === s ? "bg-[rgba(243,87,19,0.12)]" : ""}`}
                onClick={() => {
                  setFilters((f) => ({ ...f, status: s }));
                  setRequestPage(1);
                  setShowStatusDropdown(false);
                }}
              >
                {REGISTRATION_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {requestsLoading ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#F35713]" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      ) : requests.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Запросы не найдены</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="flex-1 text-base font-semibold text-foreground">{req.full_name}</h3>
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    req.status === "pending"
                      ? "bg-[rgba(243,87,19,0.2)] text-[#F35713]"
                      : req.status === "approved"
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : "bg-red-500/15 text-red-600 dark:text-red-400"
                  }`}
                >
                  {REGISTRATION_STATUS_LABELS[req.status] ?? req.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Телефон: {req.phone}</p>
              <p className="text-sm text-muted-foreground">Офис: {req.office?.name ?? "—"}</p>
              <p className="text-sm text-muted-foreground">
                Роль: {ROLE_LABELS[req.role] ?? req.role}
              </p>
              {req.role === "client" ? (
                <p className="text-sm text-muted-foreground">
                  Компания:{" "}
                  {req.company?.name
                    ? req.company.name
                    : req.company_other_name
                      ? `Другое — ${req.company_other_name}`
                      : "Не указана"}
                </p>
              ) : null}
              {req.role === "executor" && req.service_category ? (
                <p className="text-sm text-muted-foreground">
                  Категория: {formatServiceCategoryDisplayName(req.service_category.name)}
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                Дата: {formatRequestDate(req.created_at)}
              </p>

              {req.status === "pending" ? (
                <>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleApprove(req.id)}
                      disabled={actionRequestId === req.id}
                      className="flex flex-1 items-center justify-center rounded-xl border-[1.5px] border-green-600 bg-green-500/10 py-2.5 text-sm font-semibold text-green-600 disabled:opacity-50 dark:text-green-400"
                    >
                      {actionRequestId === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Одобрить"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      disabled={actionRequestId === req.id}
                      className="flex flex-1 items-center justify-center rounded-xl border-[1.5px] border-red-600 bg-red-500/10 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50 dark:text-red-400"
                    >
                      Отклонить
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingRequest(req)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 py-2.5 text-sm font-medium text-foreground"
                  >
                    <Edit className="h-4 w-4" />
                    Изменить офис / компанию
                  </button>
                </>
              ) : null}

              {req.status === "rejected" ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(req.id)}
                    disabled={actionRequestId === req.id}
                    className="flex w-full items-center justify-center rounded-xl border border-border bg-muted/50 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50 dark:text-red-400"
                  >
                    {actionRequestId === req.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Удалить"
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {!requestsLoading && requestMeta.total > 0 ? (
        <div className="border-t border-border pt-4">
          <p className="mb-3 text-center text-sm text-muted-foreground">
            Страница {requestMeta.page} из {requestMeta.totalPages} · Всего {requestMeta.total}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={requestMeta.page <= 1}
              onClick={() => setRequestPage((p) => Math.max(1, p - 1))}
              className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              Назад
            </button>
            <button
              type="button"
              disabled={requestMeta.page >= requestMeta.totalPages}
              onClick={() => setRequestPage((p) => Math.min(requestMeta.totalPages, p + 1))}
              className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              Вперёд
            </button>
          </div>
        </div>
      ) : null}

      <RegistrationRequestEditSheet
        open={editingRequest != null}
        request={editingRequest}
        offices={offices}
        onClose={() => setEditingRequest(null)}
        onSaved={() => {
          toast({ title: "Заявка обновлена" });
          loadRequests();
        }}
      />

      <AlertDialog
        open={deleteConfirmId != null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <ManagementAlertDialogContent>
          <AlertDialogHeader>
            <ManagementAlertDialogTitle>Удалить запрос?</ManagementAlertDialogTitle>
            <ManagementAlertDialogDescription>
              Запись об отклонённой заявке будет удалена безвозвратно.
            </ManagementAlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <ManagementAlertDialogCancel>Отмена</ManagementAlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId != null && handleDeleteRejected(deleteConfirmId)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </ManagementAlertDialogContent>
      </AlertDialog>
    </div>
  );
}
