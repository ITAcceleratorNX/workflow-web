"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  COMPLEXITY_OPTIONS,
  formatServiceCategoryDisplayName,
  matchServiceCategoryInOffice,
  REQUEST_TYPE_OPTIONS,
  SLA_OPTIONS,
  type OfficeServiceCategory,
} from "@/constants/requests";
import type { RequestGroup } from "@/lib/types/request";
import { getSubRequestCategoryId } from "@/lib/request-utils";
import { MANAGEMENT_MODAL_DARK_CLASS } from "@/constants/management-modal-ui";
import {
  REQUESTS_DESKTOP_OUTLINE_BTN,
  REQUESTS_DESKTOP_SELECT_CONTENT,
  REQUESTS_DESKTOP_SELECT_ITEM,
  REQUESTS_DESKTOP_SELECT_TRIGGER,
} from "@/constants/mobile-requests-ui";
import { cn } from "@/lib/utils";
import { getExecutors, type ExecutorInCategory } from "@/lib/users-management-api";

/** Значение Select «Исполнитель»: заявка уходит Офис-менеджеру. */
const HAND_TO_DEPARTMENT_HEAD = "department-head";

export type AdminAcceptRequestPayload = {
  request_type: string;
  location_detail?: string;
  office_id: number;
  sub_requests: Array<{
    id: number;
    sla: string | null;
    complexity: string | null;
    category_id?: number;
    /** Прямое назначение Администратором, минуя Офис-менеджера. */
    executors?: Array<{ id: number; role: "leader" | "executor" }>;
  }>;
};

type OfficeOption = { id: number; name: string };

interface AdminAcceptRequestModalProps {
  isOpen: boolean;
  request: RequestGroup | null;
  offices: OfficeOption[];
  /** Категории выбранного офиса: грузятся родителем по onOfficeChange. */
  categories: OfficeServiceCategory[];
  categoriesLoading?: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  /** Офис, выбранный в модалке (null — не выбран): родитель грузит его категории. */
  onOfficeChange: (officeId: number | null) => void;
  onAccept: (payload: AdminAcceptRequestPayload) => Promise<void>;
}

export function AdminAcceptRequestModal({
  isOpen,
  request,
  offices,
  categories,
  categoriesLoading = false,
  loading = false,
  error,
  onClose,
  onOfficeChange,
  onAccept,
}: AdminAcceptRequestModalProps) {
  const [requestType, setRequestType] = useState("normal");
  const [locationDetail, setLocationDetail] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [subSettings, setSubSettings] = useState<
    Record<number, { sla: string; complexity: string }>
  >({});
  /** category_id подзаявки в выбранном офисе (строка — значение Select). */
  const [subCategoryIds, setSubCategoryIds] = useState<Record<number, string>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  /** Исполнитель подзаявки при прямом назначении; HAND_TO_DEPARTMENT_HEAD — передать Офис-менеджеру. */
  const [subExecutorIds, setSubExecutorIds] = useState<Record<number, string>>({});
  /** Исполнители, которым открыт офис, по ключу `${officeId}:${categoryId}`. */
  const [executorsByKey, setExecutorsByKey] = useState<Record<string, ExecutorInCategory[] | "loading">>({});

  const subRequests = useMemo(() => request?.requests ?? [], [request]);

  const keepsOriginalOffice =
    request != null && parseInt(officeId, 10) === Number(request.office_id);

  /**
   * Категории выбранного офиса. Для родного офиса заявки добавляем её текущую
   * категорию, даже если её нет в справочнике (переименована / удалена), —
   * иначе принять заявку без смены офиса стало бы невозможно.
   */
  const availableCategories = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, { id: c.id, name: c.name }]));
    if (keepsOriginalOffice) {
      subRequests.forEach((sr) => {
        const id = getSubRequestCategoryId(sr);
        if (id != null && !byId.has(id)) {
          byId.set(id, { id, name: sr.category?.name ?? `Категория #${id}` });
        }
      });
    }
    return [...byId.values()];
  }, [categories, keepsOriginalOffice, subRequests]);

  const categoryOptions = useMemo(
    () =>
      availableCategories.map((c) => ({
        value: String(c.id),
        label: formatServiceCategoryDisplayName(c.name),
      })),
    [availableCategories],
  );

  useEffect(() => {
    if (!isOpen || !request) return;
    setRequestType(request.request_type || "normal");
    setLocationDetail(request.location_detail || "");
    setOfficeId(request.office_id ? String(request.office_id) : "");
    const next: Record<number, { sla: string; complexity: string }> = {};
    (request.requests ?? []).forEach((sr) => {
      next[sr.id] = { sla: sr.sla || "", complexity: sr.complexity || "" };
    });
    setSubSettings(next);
    setSubCategoryIds({});
    setSubExecutorIds({});
    setLocalError(null);
  }, [isOpen, request]);

  /** Родитель грузит категории выбранного офиса: они нужны для подзаявок. */
  useEffect(() => {
    if (!isOpen) return;
    const parsed = parseInt(officeId, 10);
    onOfficeChange(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
  }, [isOpen, officeId, onOfficeChange]);

  /**
   * Категории принадлежат офису, поэтому при смене офиса подбираем категорию
   * нового офиса по направлению заявки; своя категория офиса остаётся как есть.
   */
  useEffect(() => {
    if (!isOpen || categoriesLoading) return;
    setSubCategoryIds(() => {
      const next: Record<number, string> = {};
      subRequests.forEach((sr) => {
        const currentId = getSubRequestCategoryId(sr);
        const keepsCurrent =
          currentId != null && availableCategories.some((c) => c.id === currentId);
        const matchedId = keepsCurrent
          ? currentId
          : matchServiceCategoryInOffice(sr.category?.name, availableCategories);
        next[sr.id] = matchedId != null ? String(matchedId) : "";
      });
      return next;
    });
  }, [isOpen, availableCategories, categoriesLoading, subRequests]);

  const setSubCategory = useCallback((subRequestId: number, value: string) => {
    setSubCategoryIds((prev) => ({ ...prev, [subRequestId]: value }));
    setSubExecutorIds((prev) => ({ ...prev, [subRequestId]: HAND_TO_DEPARTMENT_HEAD }));
  }, []);

  const officeNumericForExecutors = parseInt(officeId, 10);
  const executorKeyFor = useCallback(
    (subRequestId: number) => {
      const categoryId = Number(subCategoryIds[subRequestId]);
      if (!Number.isFinite(officeNumericForExecutors) || !Number.isInteger(categoryId) || categoryId <= 0) {
        return null;
      }
      return `${officeNumericForExecutors}:${categoryId}`;
    },
    [officeNumericForExecutors, subCategoryIds],
  );

  /** Исполнители офиса заявки (выбран этот офис или «Все офисы») с категорией подзаявки. */
  useEffect(() => {
    if (!isOpen) return;
    const keys = new Set(
      subRequests.map((sr) => executorKeyFor(sr.id)).filter((k): k is string => k != null),
    );
    keys.forEach((key) => {
      if (executorsByKey[key] !== undefined) return;
      const [oid, cid] = key.split(":").map(Number);
      setExecutorsByKey((prev) => ({ ...prev, [key]: "loading" }));
      void getExecutors(cid, oid).then((res) => {
        setExecutorsByKey((prev) => ({ ...prev, [key]: res.ok ? res.data : [] }));
      });
    });
  }, [isOpen, subRequests, executorKeyFor, executorsByKey]);

  /** При смене офиса выбранные Исполнители могут быть ему не открыты — сбрасываем выбор. */
  useEffect(() => {
    setSubExecutorIds({});
  }, [officeId]);

  const directAssignCount = subRequests.filter((sr) => {
    const picked = subExecutorIds[sr.id];
    return picked && picked !== HAND_TO_DEPARTMENT_HEAD;
  }).length;
  const allDirect = subRequests.length > 0 && directAssignCount === subRequests.length;

  if (!isOpen || !request) return null;

  const handleAccept = async () => {
    setLocalError(null);
    const officeNumeric = parseInt(officeId, 10);
    if (!Number.isFinite(officeNumeric)) {
      setLocalError("Выберите офис");
      return;
    }
    if (categoriesLoading) {
      setLocalError("Категории офиса ещё загружаются");
      return;
    }
    // Категория чужого офиса оставит заявку на исполнителях прежнего офиса.
    const allHaveCategory = (request.requests ?? []).every((sr) => {
      const picked = Number(subCategoryIds[sr.id]);
      return Number.isInteger(picked) && availableCategories.some((c) => c.id === picked);
    });
    if (!allHaveCategory) {
      setLocalError("Выберите категорию выбранного офиса для всех подзаявок");
      return;
    }
    const sub_requests = (request.requests ?? []).map((sr) => {
      const s = subSettings[sr.id];
      return {
        id: sr.id,
        // Время и сложность необязательны: пустое значение передаём как null.
        sla: requestType === "planned" ? null : s?.sla || null,
        complexity: requestType === "planned" ? null : s?.complexity || null,
        category_id: Number(subCategoryIds[sr.id]),
        ...(subExecutorIds[sr.id] && subExecutorIds[sr.id] !== HAND_TO_DEPARTMENT_HEAD
          ? { executors: [{ id: Number(subExecutorIds[sr.id]), role: "leader" as const }] }
          : {}),
      };
    });
    await onAccept({
      request_type: requestType,
      location_detail: locationDetail,
      office_id: officeNumeric,
      sub_requests,
    });
  };

  const content = (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent
        layer={110}
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "left-0 top-auto bottom-0 w-full max-w-none translate-x-0 translate-y-0 sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] shadow-2xl p-0 gap-0",
          MANAGEMENT_MODAL_DARK_CLASS,
        )}
      >
        <div className="p-4 border-b border-gray-700">
          <DialogTitle className="text-lg font-semibold text-white">
            {allDirect ? "Назначить Исполнителя" : "Передать Офис-менеджеру"}
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-1">Заявка #{request.id}</p>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <Label className="text-xs text-gray-400">Тип заявки</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger className={cn(REQUESTS_DESKTOP_SELECT_TRIGGER, "h-9 mt-1")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={REQUESTS_DESKTOP_SELECT_CONTENT}>
                {REQUEST_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className={REQUESTS_DESKTOP_SELECT_ITEM}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Офис</Label>
            <Select value={officeId} onValueChange={setOfficeId}>
              <SelectTrigger className={cn(REQUESTS_DESKTOP_SELECT_TRIGGER, "h-9 mt-1")}>
                <SelectValue placeholder="Выберите офис" />
              </SelectTrigger>
              <SelectContent className={REQUESTS_DESKTOP_SELECT_CONTENT}>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={String(office.id)} className={REQUESTS_DESKTOP_SELECT_ITEM}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!categoriesLoading && categoryOptions.length === 0 && (
            <p className="text-[#F35713] text-sm">
              В выбранном офисе нет категорий услуг — заявку нельзя направить в этот офис.
            </p>
          )}
          <div className="space-y-3">
            {(request.requests ?? []).map((sr) => (
              <div key={sr.id} className="space-y-2 p-3 rounded-lg bg-[#262626]">
                <p className="text-white text-sm font-medium">
                  {sr.title || `Подзаявка #${sr.id}`}
                </p>
                <div>
                  <Label className="text-xs text-gray-400">Категория</Label>
                  <Select
                    value={subCategoryIds[sr.id] || ""}
                    onValueChange={(v) => setSubCategory(sr.id, v)}
                    disabled={categoriesLoading || categoryOptions.length === 0}
                  >
                    <SelectTrigger className={cn(REQUESTS_DESKTOP_SELECT_TRIGGER, "h-9 mt-1")}>
                      <SelectValue
                        placeholder={categoriesLoading ? "Загрузка..." : "Выберите категорию"}
                      />
                    </SelectTrigger>
                    <SelectContent className={REQUESTS_DESKTOP_SELECT_CONTENT}>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className={REQUESTS_DESKTOP_SELECT_ITEM}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(() => {
                  const key = executorKeyFor(sr.id);
                  const list = key ? executorsByKey[key] : undefined;
                  const executorsLoading = list === "loading";
                  const options = Array.isArray(list) ? list : [];
                  return (
                    <div>
                      <Label className="text-xs text-gray-400">Исполнитель</Label>
                      <Select
                        value={subExecutorIds[sr.id] || HAND_TO_DEPARTMENT_HEAD}
                        onValueChange={(v) =>
                          setSubExecutorIds((prev) => ({ ...prev, [sr.id]: v }))
                        }
                        disabled={!key || executorsLoading}
                      >
                        <SelectTrigger className={cn(REQUESTS_DESKTOP_SELECT_TRIGGER, "h-9 mt-1")}>
                          <SelectValue placeholder={executorsLoading ? "Загрузка..." : "Офис-менеджер"} />
                        </SelectTrigger>
                        <SelectContent className={REQUESTS_DESKTOP_SELECT_CONTENT}>
                          <SelectItem value={HAND_TO_DEPARTMENT_HEAD} className={REQUESTS_DESKTOP_SELECT_ITEM}>
                            Передать Офис-менеджеру
                          </SelectItem>
                          {options.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)} className={REQUESTS_DESKTOP_SELECT_ITEM}>
                              {e.user?.full_name || `Исполнитель #${e.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {key && Array.isArray(list) && options.length === 0 ? (
                        <p className="mt-1 text-xs text-gray-400">
                          Нет Исполнителей, которым открыт этот офис и категория
                        </p>
                      ) : null}
                    </div>
                  );
                })()}
                {requestType !== "planned" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={subSettings[sr.id]?.sla || ""}
                      onValueChange={(v) =>
                        setSubSettings((prev) => ({
                          ...prev,
                          [sr.id]: { sla: v, complexity: prev[sr.id]?.complexity || "" },
                        }))
                      }
                    >
                      <SelectTrigger className={cn(REQUESTS_DESKTOP_SELECT_TRIGGER, "h-9")}>
                        <SelectValue placeholder="Время" />
                      </SelectTrigger>
                      <SelectContent className={REQUESTS_DESKTOP_SELECT_CONTENT}>
                        {SLA_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className={REQUESTS_DESKTOP_SELECT_ITEM}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={subSettings[sr.id]?.complexity || ""}
                      onValueChange={(v) =>
                        setSubSettings((prev) => ({
                          ...prev,
                          [sr.id]: { sla: prev[sr.id]?.sla || "", complexity: v },
                        }))
                      }
                    >
                      <SelectTrigger className={cn(REQUESTS_DESKTOP_SELECT_TRIGGER, "h-9")}>
                        <SelectValue placeholder="Сложность" />
                      </SelectTrigger>
                      <SelectContent className={REQUESTS_DESKTOP_SELECT_CONTENT}>
                        {COMPLEXITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className={REQUESTS_DESKTOP_SELECT_ITEM}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </div>
          {(localError || error) && (
            <p className="text-[#F35713] text-sm">{localError || error}</p>
          )}
        </div>
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <Button
            variant="outline"
            className={cn("flex-1 h-auto min-h-11 min-w-0 whitespace-normal", REQUESTS_DESKTOP_OUTLINE_BTN)}
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 h-auto min-h-11 min-w-0 whitespace-normal bg-[#15803D] hover:bg-[#166534] text-white"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : allDirect ? (
              "Назначить"
            ) : (
              "Передать"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return content;
}

interface AdminRejectRequestModalProps {
  isOpen: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
}

export function AdminRejectRequestModal({
  isOpen,
  loading = false,
  error,
  onClose,
  onReject,
}: AdminRejectRequestModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent
        layer={110}
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "left-0 top-auto bottom-0 w-full max-w-none translate-x-0 translate-y-0 sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] shadow-2xl p-0 gap-0",
          MANAGEMENT_MODAL_DARK_CLASS,
        )}
      >
        <div className="p-4 border-b border-gray-700">
          <DialogTitle className="text-lg font-semibold text-white">Отклонить заявку</DialogTitle>
        </div>
        <div className="p-4 space-y-3">
          <Label className="text-xs text-gray-400">Причина отклонения (обязательно)</Label>
          <p className="text-xs text-gray-500">Клиент увидит причину в карточке заявки и в уведомлении.</p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Укажите причину..."
            className="bg-[#262626] border-[#3A3A3C] text-white min-h-[100px]"
          />
          {error && <p className="text-[#F35713] text-sm">{error}</p>}
        </div>
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <Button
            variant="outline"
            className={cn("flex-1 h-auto min-h-11 min-w-0 whitespace-normal", REQUESTS_DESKTOP_OUTLINE_BTN)}
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 h-auto min-h-11 min-w-0 whitespace-normal bg-red-600 hover:bg-red-700 text-white"
            disabled={loading || !reason.trim()}
            onClick={() => onReject(reason.trim())}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Отклонить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return content;
}

interface ClientRemarkModalProps {
  isOpen: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (remark: string) => Promise<void> | void;
}

/** «Есть замечания»: Клиент описывает, что не так, и заявка возвращается на доработку. */
export function ClientRemarkModal({ isOpen, loading = false, error, onClose, onSubmit }: ClientRemarkModalProps) {
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (isOpen) setRemark("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent
        layer={110}
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "left-0 top-auto bottom-0 w-full max-w-none translate-x-0 translate-y-0 sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] shadow-2xl p-0 gap-0",
          MANAGEMENT_MODAL_DARK_CLASS,
        )}
      >
        <div className="p-4 border-b border-gray-700">
          <DialogTitle className="text-lg font-semibold text-white">Есть замечания</DialogTitle>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-300">
            Заявка не закроется и вернётся на доработку. Когда работы выполнят повторно, вы снова получите её на подтверждение.
          </p>
          <Label className="text-xs text-gray-400">Замечание (обязательно)</Label>
          <Textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            maxLength={2000}
            placeholder="Что осталось не сделано?"
            className="bg-[#262626] border-[#3A3A3C] text-white min-h-[100px]"
          />
          {error && <p className="text-[#F35713] text-sm">{error}</p>}
        </div>
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <Button
            variant="outline"
            className={cn("flex-1 h-auto min-h-11 min-w-0 whitespace-normal", REQUESTS_DESKTOP_OUTLINE_BTN)}
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 h-auto min-h-11 min-w-0 whitespace-normal bg-[#F35713] hover:bg-[#E04A0A] text-white"
            disabled={loading || !remark.trim()}
            onClick={() => void onSubmit(remark.trim())}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Отправить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteRequestModalProps {
  isOpen: boolean;
  /** Сколько заявок удаляется: 1 — одна заявка, больше — массовое удаление. */
  count: number;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  /** reason — null, если причина не указана: она необязательна. */
  onDelete: (reason: string | null) => Promise<void> | void;
}

/** Логическое удаление заявки Руководителем платформы; причина необязательна. */
export function DeleteRequestModal({
  isOpen,
  count,
  loading = false,
  error,
  onClose,
  onDelete,
}: DeleteRequestModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent
        layer={110}
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "left-0 top-auto bottom-0 w-full max-w-none translate-x-0 translate-y-0 sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] shadow-2xl p-0 gap-0",
          MANAGEMENT_MODAL_DARK_CLASS,
        )}
      >
        <div className="p-4 border-b border-gray-700">
          <DialogTitle className="text-lg font-semibold text-white">
            {count === 1 ? "Удалить заявку?" : `Удалить заявки (${count})?`}
          </DialogTitle>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-300">
            Заявки исчезнут из списков. Запись, история и факт удаления сохранятся в журнале удалений.
          </p>
          <Label className="text-xs text-gray-400">Причина удаления (необязательно)</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
            placeholder="Например: дубликат заявки"
            className="bg-[#262626] border-[#3A3A3C] text-white min-h-[80px]"
          />
          {error && <p className="text-[#F35713] text-sm">{error}</p>}
        </div>
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <Button
            variant="outline"
            className={cn("flex-1 h-auto min-h-11 min-w-0 whitespace-normal", REQUESTS_DESKTOP_OUTLINE_BTN)}
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 h-auto min-h-11 min-w-0 whitespace-normal bg-red-600 hover:bg-red-700 text-white"
            disabled={loading}
            onClick={() => void onDelete(reason.trim() || null)}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Удалить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StaffCompleteModalProps {
  isOpen: boolean;
  requestId: number;
  subCount: number;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
}

export function StaffCompleteModal({
  isOpen,
  requestId,
  subCount,
  loading = false,
  error,
  onClose,
  onConfirm,
}: StaffCompleteModalProps) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (isOpen) setComment("");
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent
        layer={110}
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "left-0 top-auto bottom-0 w-full max-w-none translate-x-0 translate-y-0 sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] shadow-2xl p-0 gap-0",
          MANAGEMENT_MODAL_DARK_CLASS,
        )}
      >
        <div className="p-4 border-b border-gray-700">
          <DialogTitle className="text-lg font-semibold text-white">Завершить без назначения</DialogTitle>
          <p className="text-sm text-gray-400 mt-1">
            Заявка #{requestId}
            {subCount > 1 ? ` · подзаявок: ${subCount}` : ""}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Заявка уйдёт Клиенту на подтверждение; без ответа закроется автоматически через 24 часа.
          </p>
        </div>
        <div className="p-4 space-y-3">
          <Label className="text-xs text-gray-400">Комментарий (опционально)</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Комментарий к завершению..."
            className="bg-[#262626] border-[#3A3A3C] text-white min-h-[80px]"
          />
          {error && <p className="text-[#F35713] text-sm">{error}</p>}
        </div>
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <Button
            variant="outline"
            className={cn("flex-1 h-auto min-h-11 min-w-0 whitespace-normal", REQUESTS_DESKTOP_OUTLINE_BTN)}
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 h-auto min-h-11 min-w-0 whitespace-normal bg-[#114A65] hover:bg-[#0d3a4f] text-white"
            disabled={loading}
            onClick={() => onConfirm(comment)}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Завершить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return content;
}
