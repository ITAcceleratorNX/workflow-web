"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Landmark,
  Loader2,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";

import { TaskPickerShell, type TaskPickerVariant } from "@/components/tasks/task-picker-shell";
import type { TaskDetailColors } from "@/components/tasks/task-history-section";
import { useTaskPickerTheme } from "@/hooks/use-task-picker-theme";
import { useToast } from "@/hooks/use-toast";
import {
  getTaskParticipants,
  groupRecipientLabel,
  setTaskResponsible,
  type TaskParticipant,
} from "@/lib/task-recipients-api";
import type { UserTask } from "@/lib/user-tasks-api";
import { cn } from "@/lib/utils";

type Props = {
  task: UserTask;
  currentUserId: number | null;
  colors: TaskDetailColors;
  desktop?: boolean;
  /** После смены ответственного: перечитать задачу и списки. */
  onChanged: () => void;
};

/** Карточка групповой задачи: получатель, ответственный и правило завершения (история — TaskHistorySection). */
export function GroupTaskDetails({ task, currentUserId, colors, desktop = false, onChanged }: Props) {
  const { text, textMuted, cardBg, border } = colors;
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);

  const perms = task.group_permissions;
  const canOpenResponsible = !!perms && (perms.can_manage_responsible || perms.can_take_responsibility);
  const responsibleName = task.responsible?.full_name ?? null;
  const completedBy = task.completed_by_user ?? task.completedByUser ?? null;
  const recipientValue =
    task.participants_count != null
      ? `${groupRecipientLabel(task)} · участников: ${task.participants_count}`
      : groupRecipientLabel(task);
  const ruleHint = task.completed
    ? "Задача выполнена у всех участников. Вернуть в работу может автор или ответственный, который её завершил."
    : responsibleName
      ? `Одна общая задача для всех участников. Завершить её может только ответственный: ${responsibleName}.`
      : "Одна общая задача для всех участников. Пока ответственный не назначен, завершить её может любой участник.";
  const RecipientIcon = task.assignment_type === "company" ? Building2 : task.assignment_type === "department" ? Landmark : Users;

  return (
    <>
      <p
        className={cn("font-semibold px-1", desktop ? "text-sm text-[#8E8E93] mb-0.5" : "text-xs uppercase tracking-wide")}
        style={desktop ? undefined : { color: textMuted }}
      >
        Групповая задача
      </p>
      <div
        className={cn("rounded-2xl border overflow-hidden", desktop && "border-[#3A3A3C] shadow-sm")}
        style={{ backgroundColor: desktop ? "#2C2C2E" : cardBg, borderColor: border }}
      >
        <div className="flex items-start gap-3 p-3 min-h-11">
          <RecipientIcon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: textMuted }} />
          <span className="text-sm font-medium shrink-0" style={{ color: text }}>
            Получатель
          </span>
          <span className="flex-1 text-sm text-right" style={{ color: textMuted }}>
            {recipientValue}
          </span>
        </div>
        <div className="h-px mx-3" style={{ backgroundColor: border }} />
        <button
          type="button"
          disabled={!canOpenResponsible}
          onClick={() => setSheetOpen(true)}
          className={cn(
            "w-full flex items-center gap-3 p-3 min-h-11 text-left transition-colors",
            desktop && canOpenResponsible && "rounded-lg hover:bg-white/[0.04]",
          )}
        >
          <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: textMuted }} />
          <span className="text-sm font-medium shrink-0" style={{ color: text }}>
            Ответственный
          </span>
          <span className="flex-1 text-sm text-right truncate" style={{ color: responsibleName ? text : textMuted }}>
            {responsibleName ?? "Не назначен"}
          </span>
          {canOpenResponsible ? <ChevronRight className="h-5 w-5 shrink-0" style={{ color: textMuted }} /> : null}
        </button>
        {task.completed && completedBy?.full_name ? (
          <>
            <div className="h-px mx-3" style={{ backgroundColor: border }} />
            <div className="flex items-center gap-3 p-3 min-h-11">
              <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: textMuted }} />
              <span className="text-sm font-medium" style={{ color: text }}>
                Завершил
              </span>
              <span className="flex-1 text-sm text-right truncate" style={{ color: textMuted }}>
                {completedBy.full_name}
              </span>
            </div>
          </>
        ) : null}
        <div className="border-t px-3 py-2.5" style={{ borderColor: border }}>
          <p className="text-xs leading-relaxed" style={{ color: textMuted }}>
            {ruleHint}
          </p>
        </div>
      </div>

      <ResponsiblePicker
        visible={sheetOpen}
        task={task}
        currentUserId={currentUserId}
        variant={desktop ? "dialog" : "sheet"}
        onClose={() => setSheetOpen(false)}
        onApply={async (userId) => {
          const res = await setTaskResponsible(task.id, userId);
          if (!res.ok) {
            toast({ title: "Не удалось изменить ответственного", description: res.error, variant: "destructive" });
            return;
          }
          setSheetOpen(false);
          onChanged();
        }}
      />
    </>
  );
}

type PickerProps = {
  visible: boolean;
  task: UserTask;
  currentUserId: number | null;
  variant: TaskPickerVariant;
  onClose: () => void;
  onApply: (userId: number | null) => Promise<void>;
};

function ResponsiblePicker(props: PickerProps) {
  if (!props.visible) return null;
  return <ResponsiblePickerBody {...props} />;
}

function ResponsiblePickerBody({ task, currentUserId, variant, onClose, onApply }: PickerProps) {
  const { text, textMuted, primary, border, cardBg } = useTaskPickerTheme(variant);
  const isDialog = variant === "dialog";
  const canManage = task.group_permissions?.can_manage_responsible === true;
  const canTake = task.group_permissions?.can_take_responsibility === true;

  const [query, setQuery] = useState("");
  const [participants, setParticipants] = useState<TaskParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        setLoading(true);
        const res = await getTaskParticipants(task.id, query);
        if (cancelled) return;
        setLoading(false);
        setParticipants(res.ok ? res.data : []);
      },
      query ? 300 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canManage, task.id, query]);

  const apply = useCallback(
    async (userId: number | null) => {
      if (busy) return;
      setBusy(true);
      await onApply(userId);
      setBusy(false);
    },
    [busy, onApply],
  );

  const rowClass = cn(
    "w-full flex items-center gap-3 min-h-12 text-left transition-colors disabled:opacity-60",
    isDialog ? "rounded-xl px-3 py-2.5 hover:bg-[#2C2C2E]" : "py-3 border-b",
  );
  const rowStyle = isDialog ? undefined : { borderColor: border };

  return (
    <TaskPickerShell open onClose={onClose} variant={variant} title={isDialog ? "Ответственный" : undefined} maxWidthClass="max-w-md">
      {!isDialog ? (
        <div className="flex items-center justify-between px-2 py-1">
          <button type="button" onClick={onClose} className="p-2 min-h-11 min-w-11" aria-label="Закрыть">
            <X className="h-6 w-6" style={{ color: text }} />
          </button>
          <span className="text-lg font-semibold" style={{ color: text }}>
            Ответственный
          </span>
          <span className="flex min-w-11 justify-center">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" style={{ color: primary }} /> : null}
          </span>
        </div>
      ) : null}
      <p className={cn("text-xs", isDialog ? "px-6 pt-4" : "px-4 pb-1")} style={{ color: textMuted }}>
        Ответственный завершает задачу за всех. Задача остаётся видна всем участникам.
      </p>
      <div className={cn("overflow-y-auto", isDialog ? "px-5 py-3 max-h-[min(60vh,480px)]" : "px-4 pb-8 max-h-[60vh]")}>
        {canTake && task.responsible_id !== currentUserId ? (
          <button type="button" className={rowClass} style={rowStyle} disabled={busy} onClick={() => void apply(currentUserId)}>
            <UserCheck className="h-5 w-5 shrink-0" style={{ color: primary }} />
            <span className="text-[15px]" style={{ color: primary }}>
              Назначить себя
            </span>
          </button>
        ) : null}
        {canManage && task.responsible_id != null ? (
          <button type="button" className={rowClass} style={rowStyle} disabled={busy} onClick={() => void apply(null)}>
            <UserX className="h-5 w-5 shrink-0 text-red-500" />
            <span className="text-[15px] text-red-500">Снять ответственного</span>
          </button>
        ) : null}
        {canManage ? (
          <>
            <div className="my-3 flex items-center gap-2 rounded-xl border px-3 py-2" style={{ backgroundColor: cardBg, borderColor: border }}>
              <Search className="h-5 w-5 shrink-0" style={{ color: textMuted }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Участник задачи"
                className="min-h-9 flex-1 bg-transparent text-base outline-none"
                style={{ color: text }}
              />
            </div>
            {loading && participants.length === 0 ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: primary }} />
              </div>
            ) : participants.length === 0 ? (
              <p className="py-3 text-sm" style={{ color: textMuted }}>
                Участники не найдены
              </p>
            ) : (
              participants.map((p) => {
                const selected = p.id === task.responsible_id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={rowClass}
                    style={rowStyle}
                    disabled={busy || selected}
                    onClick={() => void apply(p.id)}
                  >
                    <User className="h-5 w-5 shrink-0" style={{ color: primary }} />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-[15px]" style={{ color: text }}>
                        {p.full_name}
                        {p.id === currentUserId ? " (вы)" : ""}
                      </span>
                      {p.position ? (
                        <span className="block truncate text-xs" style={{ color: textMuted }}>
                          {p.position}
                        </span>
                      ) : null}
                    </span>
                    {selected ? <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: primary }} /> : null}
                  </button>
                );
              })
            )}
          </>
        ) : null}
      </div>
    </TaskPickerShell>
  );
}
