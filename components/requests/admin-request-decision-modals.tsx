"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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

export type AdminAcceptRequestPayload = {
  request_type: string;
  location_detail?: string;
  office_id: number;
  sub_requests: Array<{
    id: number;
    sla: string | null;
    complexity: string | null;
    category_id?: number;
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
  }, []);

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
    if (requestType !== "planned") {
      const allHave = (request.requests ?? []).every((sr) => {
        const s = subSettings[sr.id];
        return s?.sla && s?.complexity;
      });
      if (!allHave) {
        setLocalError("Укажите время выполнения и сложность для всех подзаявок");
        return;
      }
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
        sla: requestType === "planned" ? null : s?.sla ?? null,
        complexity: requestType === "planned" ? null : s?.complexity ?? null,
        category_id: Number(subCategoryIds[sr.id]),
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
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] shadow-2xl",
          MANAGEMENT_MODAL_DARK_CLASS,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Передать Офис-менеджеру</h2>
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
            className={cn("flex-1", REQUESTS_DESKTOP_OUTLINE_BTN)}
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Передать"}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
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
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] shadow-2xl",
          MANAGEMENT_MODAL_DARK_CLASS,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Отклонить заявку</h2>
        </div>
        <div className="p-4 space-y-3">
          <Label className="text-xs text-gray-400">Причина отклонения</Label>
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
            className={cn("flex-1", REQUESTS_DESKTOP_OUTLINE_BTN)}
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={loading || !reason.trim()}
            onClick={() => onReject(reason.trim())}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Отклонить"}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
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
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] shadow-2xl",
          MANAGEMENT_MODAL_DARK_CLASS,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Завершить без назначения</h2>
          <p className="text-sm text-gray-400 mt-1">
            Заявка #{requestId}
            {subCount > 1 ? ` · подзаявок: ${subCount}` : ""}
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
            className={cn("flex-1", REQUESTS_DESKTOP_OUTLINE_BTN)}
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 bg-[#114A65] hover:bg-[#0d3a4f] text-white"
            disabled={loading}
            onClick={() => onConfirm(comment)}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Завершить"}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
