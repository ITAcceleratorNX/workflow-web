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
}: Omit<SubRequestRejectFormModalProps, "isOpen" | "variant">) {
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
    <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Отклонить заявку</CardTitle>
              <CardDescription>
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
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-gray-900">{request.title}</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Категория:</span>
            <span className="text-xs font-medium text-gray-700">
              {request.category?.name || "Не указана"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason" className="text-sm font-medium">
            Причина отклонения *
          </Label>
          <Select value={selectedReason} onValueChange={setSelectedReason}>
            <SelectTrigger id="reason">
              <SelectValue placeholder="Выберите причину отклонения" />
            </SelectTrigger>
            <SelectContent>
              {SUB_REQUEST_REJECT_REASONS.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedReason === "other" && (
          <div className="space-y-2">
            <Label htmlFor="customReason" className="text-sm font-medium">
              Укажите причину *
            </Label>
            <Textarea
              id="customReason"
              placeholder="Опишите причину отклонения..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">{customReason.length}/500</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Внимание!</p>
              <p>
                После отклонения заявка будет возвращена в очередь назначения и может быть
                назначена другому исполнителю.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
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
