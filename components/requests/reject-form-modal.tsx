"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2, X, XCircle } from "lucide-react";
import { getSubRequestDisplayId } from "@/lib/subRequestUtils";
import { RequestModalShell } from "./request-modal-shell";
import { MANAGEMENT_MODAL_DARK_CLASS } from "@/constants/management-modal-ui";
import {
  REQUESTS_DESKTOP_OUTLINE_BTN,
  REQUESTS_DESKTOP_SELECT_CONTENT,
  REQUESTS_DESKTOP_SELECT_ITEM,
  REQUESTS_DESKTOP_SELECT_TRIGGER,
} from "@/constants/mobile-requests-ui";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const EXECUTOR_REJECT_REASONS = [
  "Занят",
  "Нет ресурсов",
  "Слишком сложно",
  "Нет времени",
  "Другое",
];

const SUB_REQUEST_REJECT_REASONS = [
  { value: "Технические проблемы", label: "Технические проблемы" },
  { value: "Отсутствие необходимого оборудования", label: "Отсутствие необходимого оборудования" },
  { value: "Отсутствие материалов", label: "Отсутствие материалов" },
  { value: "Проблемы безопасности", label: "Проблемы безопасности" },
  { value: "Нет доступа к месту работы", label: "Нет доступа к месту работы" },
  { value: "Неблагоприятные погодные условия", label: "Неблагоприятные погодные условия" },
  { value: "Недостаточно времени", label: "Недостаточно времени" },
  { value: "Слишком высокая сложность", label: "Слишком высокая сложность" },
  { value: "other", label: "Другая причина" },
];

interface RejectFormModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
  error?: string | null;
}

interface ExecutorRejectFormModalProps extends RejectFormModalBaseProps {
  variant: "executor";
  requestId?: number;
  isLoading?: boolean;
}

interface SubRequestRejectFormModalProps extends RejectFormModalBaseProps {
  variant: "subRequest";
  request: any;
  isSubmitting: boolean;
}

export type RejectFormModalProps = ExecutorRejectFormModalProps | SubRequestRejectFormModalProps;

function ExecutorRejectForm({
  onClose,
  onReject,
  requestId,
  isLoading = false,
  error = null,
}: Omit<ExecutorRejectFormModalProps, "isOpen" | "variant">) {
  const [rejectReason, setRejectReason] = useState("");
  const [customRejectReason, setCustomRejectReason] = useState("");

  const handleSubmit = async () => {
    const finalReason = rejectReason === "Другое" ? customRejectReason : rejectReason;
    if (!finalReason.trim()) return;

    await onReject(finalReason);
    setRejectReason("");
    setCustomRejectReason("");
  };

  const handleClose = () => {
    setRejectReason("");
    setCustomRejectReason("");
    onClose();
  };

  return (
    <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Отклонить заявку #{requestId}</CardTitle>
            <CardDescription className="text-sm">
              Выберите причину отклонения заявки. Заявка будет возвращена в очередь назначения.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reject-reason" className="text-sm font-medium text-gray-700">
            Причина отклонения
          </Label>
          <Select value={rejectReason} onValueChange={setRejectReason}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите причину" />
            </SelectTrigger>
            <SelectContent>
              {EXECUTOR_REJECT_REASONS.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {rejectReason === "Другое" && (
          <div className="space-y-2">
            <Label htmlFor="custom-reason" className="text-sm font-medium text-gray-700">
              Укажите свою причину
            </Label>
            <Textarea
              id="custom-reason"
              placeholder="Опишите причину отклонения..."
              value={customRejectReason}
              onChange={(e) => setCustomRejectReason(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !rejectReason ||
              (rejectReason === "Другое" && !customRejectReason.trim())
            }
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              "Отправить"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SubRequestRejectForm({
  onClose,
  onReject,
  request,
  isSubmitting,
  error = null,
  dark = false,
}: Omit<SubRequestRejectFormModalProps, "isOpen" | "variant"> & { dark?: boolean }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const handleSubmit = async () => {
    if (!selectedReason) return;

    const reason = selectedReason === "other" ? customReason : selectedReason;
    if (selectedReason === "other" && !customReason.trim()) return;

    await onReject(reason);
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    onClose();
  };

  return (
    <Card
      className={cn(
        "w-full max-w-md",
        dark && "bg-[#1C1C1E] border-[#3A3A3C] text-white",
        dark && MANAGEMENT_MODAL_DARK_CLASS,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                dark ? "bg-red-500/20" : "bg-red-100",
              )}
            >
              <AlertTriangle className={cn("w-5 h-5", dark ? "text-red-400" : "text-red-600")} />
            </div>
            <div>
              <CardTitle className={cn("text-lg", dark && "text-white")}>Отклонить заявку</CardTitle>
              <CardDescription className={dark ? "text-[#8E8E93]" : undefined}>
                Подзаявка № {getSubRequestDisplayId(request, request.request_group_id)}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div
          className={cn(
            "rounded-lg p-4 space-y-2",
            dark ? "bg-[#2C2C2E]" : "bg-gray-50",
          )}
        >
          <h4 className={cn("font-medium", dark ? "text-white" : "text-gray-900")}>{request.title}</h4>
          <p className={cn("text-sm line-clamp-2", dark ? "text-[#8E8E93]" : "text-gray-600")}>
            {request.description}
          </p>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs", dark ? "text-[#8E8E93]" : "text-gray-500")}>Категория:</span>
            <span className={cn("text-xs font-medium", dark ? "text-white" : "text-gray-700")}>
              {request.category?.name || "Не указана"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="reason"
            className={cn("text-sm font-medium", dark && "text-white")}
          >
            Причина отклонения *
          </Label>
          <Select value={selectedReason} onValueChange={setSelectedReason}>
            <SelectTrigger
              id="reason"
              className={dark ? REQUESTS_DESKTOP_SELECT_TRIGGER : undefined}
            >
              <SelectValue placeholder="Выберите причину отклонения" />
            </SelectTrigger>
            <SelectContent className={dark ? REQUESTS_DESKTOP_SELECT_CONTENT : undefined}>
              {SUB_REQUEST_REJECT_REASONS.map((reason) => (
                <SelectItem
                  key={reason.value}
                  value={reason.value}
                  className={dark ? REQUESTS_DESKTOP_SELECT_ITEM : undefined}
                >
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedReason === "other" && (
          <div className="space-y-2">
            <Label
              htmlFor="customReason"
              className={cn("text-sm font-medium", dark && "text-white")}
            >
              Укажите причину *
            </Label>
            <Textarea
              id="customReason"
              placeholder="Опишите причину отклонения..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className={cn(
                "min-h-[100px] resize-none",
                dark && "bg-[#2C2C2E] border-[#3A3A3C] text-white placeholder:text-[#8E8E93]",
              )}
              maxLength={500}
            />
            <p className={cn("text-xs text-right", dark ? "text-[#8E8E93]" : "text-gray-500")}>
              {customReason.length}/500
            </p>
          </div>
        )}

        {error && (
          <div
            className={cn(
              "rounded-lg p-3 border",
              dark ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200",
            )}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn("w-4 h-4", dark ? "text-red-400" : "text-red-600")} />
              <p className={cn("text-sm", dark ? "text-red-300" : "text-red-700")}>{error}</p>
            </div>
          </div>
        )}

        <div
          className={cn(
            "rounded-lg p-3 border",
            dark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200",
          )}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle
              className={cn("w-4 h-4 mt-0.5", dark ? "text-amber-400" : "text-amber-600")}
            />
            <div className={cn("text-sm", dark ? "text-amber-200" : "text-amber-800")}>
              <p className="font-medium mb-1">Внимание!</p>
              <p>
                После отклонения заявка будет возвращена в очередь назначения и может быть
                назначена другому исполнителю.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className={cn("flex-1", dark && REQUESTS_DESKTOP_OUTLINE_BTN)}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-red-600 hover:bg-red-700"
            disabled={
              isSubmitting ||
              !selectedReason ||
              (selectedReason === "other" && !customReason.trim())
            }
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Отклонение...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Отклонить
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RejectFormModal(props: RejectFormModalProps) {
  const { isOpen, onClose, variant } = props;
  const isDesktop = useIsDesktop();

  if (variant === "subRequest" && (!isOpen || !props.request)) {
    return null;
  }

  if (variant === "executor" && !isOpen) {
    return null;
  }

  return (
    <RequestModalShell
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName={variant === "executor" ? "z-50 bg-black bg-opacity-50 backdrop-blur-none" : undefined}
      closeOnOverlayClick={variant === "executor"}
    >
      {variant === "executor" ? (
        <ExecutorRejectForm
          onClose={onClose}
          onReject={props.onReject}
          requestId={props.requestId}
          isLoading={props.isLoading}
          error={props.error}
        />
      ) : (
        <SubRequestRejectForm
          onClose={onClose}
          onReject={props.onReject}
          request={props.request}
          isSubmitting={props.isSubmitting}
          error={props.error ?? null}
          dark={isDesktop}
        />
      )}
    </RequestModalShell>
  );
}

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
  requestId?: number;
  isLoading?: boolean;
  error?: string | null;
}

export function RejectModal(props: RejectModalProps) {
  return <RejectFormModal variant="executor" {...props} />;
}

interface RejectSubRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
  request: any;
  isSubmitting: boolean;
  error: string | null;
}

export const RejectSubRequestModal: React.FC<RejectSubRequestModalProps> = (props) => {
  return <RejectFormModal variant="subRequest" {...props} />;
};
