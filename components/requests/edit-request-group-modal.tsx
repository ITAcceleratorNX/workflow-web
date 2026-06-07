"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  COMPLEXITY_OPTIONS,
  formatServiceCategoryDisplayName,
  REQUEST_TYPE_OPTIONS,
  SLA_OPTIONS,
} from "@/constants/requests";
import type { RequestGroup } from "@/lib/types/request";

export type UpdateRequestGroupPayload = {
  request_type?: string;
  location_detail?: string;
  sub_requests?: Array<{
    id: number;
    title?: string;
    description?: string;
    complexity?: string;
    sla?: string;
    category_id?: number;
  }>;
};

type EditableSubRequestState = {
  title: string;
  description: string;
  complexity: string;
  sla: string;
  category_id?: number;
};

interface EditRequestGroupModalProps {
  isOpen: boolean;
  request: RequestGroup | null;
  categories: { id: number; name: string }[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (body: UpdateRequestGroupPayload) => Promise<void>;
}

export function EditRequestGroupModal({
  isOpen,
  request,
  categories,
  loading = false,
  error,
  onClose,
  onSubmit,
}: EditRequestGroupModalProps) {
  const [requestType, setRequestType] = useState("normal");
  const [locationDetail, setLocationDetail] = useState("");
  const [subRequests, setSubRequests] = useState<Record<number, EditableSubRequestState>>({});

  const displayCategories = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    (request?.requests ?? []).forEach((sr) => {
      const categoryId = sr.category_id;
      if (categoryId && !byId.has(categoryId)) {
        byId.set(categoryId, {
          id: categoryId,
          name: sr.category?.name ?? `Категория #${categoryId}`,
        });
      }
    });
    return [...byId.values()];
  }, [categories, request]);

  useEffect(() => {
    if (!isOpen || !request) return;
    setRequestType(request.request_type ?? "normal");
    setLocationDetail(request.location_detail ?? "");
    const next: Record<number, EditableSubRequestState> = {};
    (request.requests ?? []).forEach((sr) => {
      next[sr.id] = {
        title: sr.title ?? "",
        description: sr.description ?? "",
        complexity: sr.complexity ?? "",
        sla: sr.sla ?? "",
        category_id: sr.category_id ?? undefined,
      };
    });
    setSubRequests(next);
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const updateSub = (
    subRequestId: number,
    key: keyof EditableSubRequestState,
    value: string | number | undefined,
  ) => {
    setSubRequests((prev) => ({
      ...prev,
      [subRequestId]: {
        ...(prev[subRequestId] ?? {
          title: "",
          description: "",
          complexity: "",
          sla: "",
        }),
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    const updateData: UpdateRequestGroupPayload = {};
    if (requestType && requestType !== request.request_type) {
      updateData.request_type = requestType;
    }
    const normalizedLocation = locationDetail.trim();
    if (normalizedLocation !== (request.location_detail ?? "")) {
      updateData.location_detail = normalizedLocation;
    }
    const subRequestUpdates: NonNullable<UpdateRequestGroupPayload["sub_requests"]> = [];
    (request.requests ?? []).forEach((sr) => {
      const editable = subRequests[sr.id];
      if (!editable) return;
      const hasChanges =
        editable.title !== (sr.title ?? "") ||
        editable.description !== (sr.description ?? "") ||
        editable.complexity !== (sr.complexity ?? "") ||
        editable.sla !== (sr.sla ?? "") ||
        (editable.category_id ?? null) !== (sr.category_id ?? null);
      if (!hasChanges) return;
      const item: NonNullable<UpdateRequestGroupPayload["sub_requests"]>[number] = { id: sr.id };
      if (editable.title !== (sr.title ?? "")) item.title = editable.title;
      if (editable.description !== (sr.description ?? "")) item.description = editable.description;
      if (editable.complexity !== (sr.complexity ?? "")) item.complexity = editable.complexity;
      if (editable.sla !== (sr.sla ?? "")) item.sla = editable.sla;
      if ((editable.category_id ?? null) !== (sr.category_id ?? null) && editable.category_id) {
        item.category_id = editable.category_id;
      }
      subRequestUpdates.push(item);
    });
    if (subRequestUpdates.length > 0) updateData.sub_requests = subRequestUpdates;
    if (Object.keys(updateData).length === 0) {
      onClose();
      return;
    }
    await onSubmit(updateData);
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
        <div className="p-4 border-b border-gray-700 sticky top-0 bg-[#1C1C1E]">
          <h2 className="text-lg font-semibold text-white">Редактировать заявку</h2>
          <p className="text-sm text-gray-400 mt-1">Заявка #{request.id}</p>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <Label className="text-xs text-gray-400">Тип заявки</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger className="bg-[#262626] border-[#3A3A3C] text-white h-9 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[120] bg-[#2C2C2E]">
                {REQUEST_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Локация в офисе</Label>
            <Input
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
              className="bg-[#262626] border-[#3A3A3C] text-white mt-1"
            />
          </div>
          {(request.requests ?? []).map((sr) => {
            const editable = subRequests[sr.id];
            if (!editable) return null;
            return (
              <div key={sr.id} className="space-y-2 p-3 rounded-lg bg-[#262626]">
                <p className="text-white text-sm font-medium">Подзаявка #{sr.id}</p>
                <Input
                  value={editable.title}
                  onChange={(e) => updateSub(sr.id, "title", e.target.value)}
                  placeholder="Название"
                  className="bg-[#1C1C1E] border-[#3A3A3C] text-white"
                />
                <Textarea
                  value={editable.description}
                  onChange={(e) => updateSub(sr.id, "description", e.target.value)}
                  placeholder="Описание"
                  className="bg-[#1C1C1E] border-[#3A3A3C] text-white min-h-[72px]"
                />
                {displayCategories.length > 0 && (
                  <Select
                    value={editable.category_id ? String(editable.category_id) : ""}
                    onValueChange={(v) => updateSub(sr.id, "category_id", parseInt(v, 10))}
                  >
                    <SelectTrigger className="bg-[#1C1C1E] border-[#3A3A3C] text-white h-9">
                      <SelectValue placeholder="Категория" />
                    </SelectTrigger>
                    <SelectContent className="z-[120] bg-[#2C2C2E]">
                      {displayCategories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)} className="text-white">
                          {formatServiceCategoryDisplayName(c.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={editable.sla}
                    onValueChange={(v) => updateSub(sr.id, "sla", v)}
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
                    value={editable.complexity}
                    onValueChange={(v) => updateSub(sr.id, "complexity", v)}
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
            );
          })}
          {error && <p className="text-[#F35713] text-sm">{error}</p>}
        </div>
        <div className="p-4 border-t border-gray-700 flex gap-3 sticky bottom-0 bg-[#1C1C1E]">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button
            className="flex-1 bg-[#F35713] hover:bg-[#E04F10] text-white"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сохранить"}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
