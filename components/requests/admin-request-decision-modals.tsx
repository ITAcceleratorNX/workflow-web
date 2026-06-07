"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  COMPLEXITY_OPTIONS,
  REQUEST_TYPE_OPTIONS,
  SLA_OPTIONS,
} from "@/constants/requests";
import type { RequestGroup } from "@/lib/types/request";

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
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onAccept: (payload: AdminAcceptRequestPayload) => Promise<void>;
}

export function AdminAcceptRequestModal({
  isOpen,
  request,
  offices,
  loading = false,
  error,
  onClose,
  onAccept,
}: AdminAcceptRequestModalProps) {
  const [requestType, setRequestType] = useState("normal");
  const [locationDetail, setLocationDetail] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [subSettings, setSubSettings] = useState<
    Record<number, { sla: string; complexity: string }>
  >({});
  const [localError, setLocalError] = useState<string | null>(null);

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
    setLocalError(null);
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const handleAccept = async () => {
    setLocalError(null);
    const officeNumeric = parseInt(officeId, 10);
    if (!Number.isFinite(officeNumeric)) {
      setLocalError("Выберите офис");
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
    const sub_requests = (request.requests ?? []).map((sr) => {
      const s = subSettings[sr.id];
      return {
        id: sr.id,
        sla: requestType === "planned" ? null : s?.sla ?? null,
        complexity: requestType === "planned" ? null : s?.complexity ?? null,
        category_id: sr.category_id,
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
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Принять заявку</h2>
          <p className="text-sm text-gray-400 mt-1">Заявка #{request.id}</p>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <Label className="text-xs text-gray-400">Тип заявки</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger className="bg-[#262626] border-[#3A3A3C] text-white h-9 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[120] bg-[#2C2C2E] border-[#3A3A3C]">
                {REQUEST_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Офис</Label>
            <Select value={officeId} onValueChange={setOfficeId}>
              <SelectTrigger className="bg-[#262626] border-[#3A3A3C] text-white h-9 mt-1">
                <SelectValue placeholder="Выберите офис" />
              </SelectTrigger>
              <SelectContent className="z-[120] bg-[#2C2C2E] border-[#3A3A3C]">
                {offices.map((office) => (
                  <SelectItem key={office.id} value={String(office.id)} className="text-white">
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {requestType !== "planned" && (
            <div className="space-y-3">
              {(request.requests ?? []).map((sr) => (
                <div key={sr.id} className="space-y-2 p-3 rounded-lg bg-[#262626]">
                  <p className="text-white text-sm font-medium">
                    {sr.title || `Подзаявка #${sr.id}`}
                  </p>
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
                      <SelectTrigger className="bg-[#1C1C1E] border-[#3A3A3C] text-white h-9">
                        <SelectValue placeholder="Время" />
                      </SelectTrigger>
                      <SelectContent className="z-[120] bg-[#2C2C2E]">
                        {SLA_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-white">
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
                      <SelectTrigger className="bg-[#1C1C1E] border-[#3A3A3C] text-white h-9">
                        <SelectValue placeholder="Сложность" />
                      </SelectTrigger>
                      <SelectContent className="z-[120] bg-[#2C2C2E]">
                        {COMPLEXITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-white">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(localError || error) && (
            <p className="text-[#F35713] text-sm">{localError || error}</p>
          )}
        </div>
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button
            className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Принять"}
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
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] shadow-2xl"
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
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
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
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C] shadow-2xl"
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
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
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
