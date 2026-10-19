"use client";

import { CheckCircle2, Clock, MessageSquareWarning } from "lucide-react";
import { formatDateTime } from "@/lib/dateTimeUtils";
import { clientConfirmationDeadline } from "@/lib/request-permissions";
import type { RequestGroup } from "@/lib/types/request";
import { cn } from "@/lib/utils";

interface RequestClosureInfoProps {
  request: RequestGroup;
  /** Текущий пользователь — автор заявки: ему адресованы подсказки о подтверждении. */
  isAuthor: boolean;
  /** Тёмная панель десктопа или тема приложения. */
  dark?: boolean;
}

/**
 * Где заявка на пути к закрытию: работы ждут подтверждения Администратора, результат ждёт
 * Клиента (до какого времени), Клиент вернул её с замечаниями, как она закрыта.
 */
export function RequestClosureInfo({ request, isAuthor, dark = false }: RequestClosureInfoProps) {
  const muted = dark ? "text-gray-400" : "text-muted-foreground";
  const strong = dark ? "text-white" : "text-foreground";
  const box = cn("rounded-xl border p-4 space-y-1", dark ? "border-white/10 bg-[#1C1C1E]" : "border-border bg-muted/40");
  const deadline = clientConfirmationDeadline(request);

  if (deadline) {
    return (
      <div className={box}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#F35713]" />
          <p className={cn("font-medium", strong)}>
            {isAuthor ? "Подтвердите выполнение" : "Ожидает подтверждения Клиента"}
          </p>
        </div>
        <p className={cn("text-sm", muted)}>
          {isAuthor
            ? `Подтвердите результат или оставьте замечания до ${formatDateTime(deadline)}. Без ответа заявка закроется автоматически.`
            : `Заявка закроется автоматически ${formatDateTime(deadline)}, если Клиент не ответит.`}
        </p>
      </div>
    );
  }

  if (request.status === "awaiting_admin_review") {
    return (
      <div className={box}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <p className={cn("font-medium", strong)}>Работы выполнены — на проверке</p>
        </div>
        <p className={cn("text-sm", muted)}>
          {request.work_done_at ? `${formatDateTime(request.work_done_at)} · ` : ""}
          {isAuthor
            ? "Администратор проверит результат и передаст заявку вам на подтверждение."
            : "Ждёт подтверждения Администратора, затем уйдёт Клиенту."}
        </p>
      </div>
    );
  }

  if (request.status === "execution" && request.last_remark) {
    return (
      <div className={cn("rounded-xl border p-4 space-y-1", dark ? "border-[#F35713]/30 bg-[#F35713]/10" : "border-[#F35713]/30 bg-[#F35713]/10")}>
        <div className="flex items-center gap-2">
          <MessageSquareWarning className="h-4 w-4 text-[#F35713]" />
          <p className={cn("font-medium", strong)}>
            {isAuthor ? "Ваши замечания переданы на доработку" : "Замечания Клиента — заявка на доработке"}
          </p>
        </div>
        <p className={cn("whitespace-pre-wrap break-words", strong)}>{request.last_remark}</p>
        {request.last_remark_at && <p className={cn("text-xs", muted)}>{formatDateTime(request.last_remark_at)}</p>}
      </div>
    );
  }

  if (request.status === "completed" && request.close_method) {
    return (
      <div className={box}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <p className={cn("font-medium", strong)}>
            {request.close_method === "auto" ? "Закрыта автоматически" : "Подтверждена Клиентом"}
          </p>
        </div>
        <p className={cn("text-sm", muted)}>
          {request.close_method === "auto" ? "Подтверждение не поступило в течение 24 часов" : "Клиент принял результат"}
          {request.closed_at ? ` · ${formatDateTime(request.closed_at)}` : ""}
        </p>
      </div>
    );
  }

  return null;
}
