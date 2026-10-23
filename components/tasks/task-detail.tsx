"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  Eye,
  Flag,
  Loader2,
  RotateCcw,
  Trash2,
  User,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ModalWindow } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineEditText } from "@/components/ui/inline-edit-text";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { GroupTaskDetails } from "@/components/tasks/group-task-details";
import { TaskAttachmentsSection } from "@/components/tasks/task-attachments-section";
import { TaskChoicePicker } from "@/components/tasks/task-choice-picker";
import { TaskDueEditor, type DueValue } from "@/components/tasks/task-due-editor";
import { TaskHistorySection } from "@/components/tasks/task-history-section";
import { RecipientPickerPanel, RecipientPickerScreen } from "@/components/tasks/task-recipient-select";
import { TaskCommentsSection } from "@/components/task-comments/task-comments-section";
import { useTaskDetail } from "@/hooks/use-task-detail";
import { isGroupTask, isReadOnlyTask, taskToggleBlockedReason } from "@/lib/group-task-completion";
import { dueToScheduledAt, formatDue, isTaskOverdue, taskDue } from "@/lib/task-due";
import { TASK_DESCRIPTION_MAX_LENGTH, TASK_TITLE_MAX_LENGTH } from "@/lib/task-fields";
import { hasOtherRecipient, taskRecipientLabel, taskRecipientSummary } from "@/lib/task-recipient-display";
import { normalizeRecurrenceFromApi } from "@/lib/task-recurrence";
import { reminderLabel, reminderOptionsFor, reminderValue } from "@/lib/task-reminders";
import { canDeleteUserTask, canEditUserTaskDetails, type TaskPriority, type UserTask } from "@/lib/user-tasks-api";
import type { RecipientSelection } from "@/lib/task-recipients-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

const PRIORITY_LABEL: Record<TaskPriority, string> = { low: "Низкий", medium: "Средний", high: "Высокий" };
const PRIORITY_CHOICES = (["low", "medium", "high"] as const).map((value) => ({ value, label: PRIORITY_LABEL[value] }));

/** Colors of the reused sections (history, group task, comments) from the product UI tokens. */
const SECTION_COLORS = {
  page: {
    text: "hsl(var(--ui-fg))",
    textMuted: "hsl(var(--ui-fg) / 0.5)",
    primary: "hsl(var(--ui-accent))",
    cardBg: "hsl(var(--ui-surface))",
    border: "hsl(var(--ui-fg) / 0.08)",
  },
  panel: {
    text: "hsl(var(--ui-fg))",
    textMuted: "hsl(var(--ui-fg) / 0.5)",
    primary: "hsl(var(--ui-accent))",
    cardBg: "hsl(var(--ui-fg) / 0.03)",
    border: "hsl(var(--ui-fg) / 0.08)",
  },
} as const;

type TaskDetailProps = {
  taskId: number;
  todayKey: string;
  /** `page` — the phone screen of a task; `panel` — the card next to the desktop list. */
  variant: "page" | "panel";
  /** Back on the phone, the close button of the desktop card. */
  onClose: () => void;
  /** The task was deleted or is no longer visible to the user. */
  onGone: () => void;
};

/**
 * The task card (Figma «Задачи · Карточка задачи», «Входящие + карточка»): title and status,
 * «Отметить выполненной», «Исполнитель / Срок / Приоритет / Напоминание», «Описание», handing over,
 * deletion, attachments, the history and comments. What the user may change comes from the server.
 */
export function TaskDetail({ taskId, todayKey, variant, onClose, onGone }: TaskDetailProps) {
  const detail = useTaskDetail(taskId, { onGone });
  const panel = variant === "panel";

  if (detail.state.status === "loading" || (detail.state.status === "ready" && !detail.task)) {
    return (
      <DetailFrame variant={variant} onClose={onClose}>
        <div role="status" className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-ui-accent" aria-label="Загружаем задачу" />
        </div>
      </DetailFrame>
    );
  }
  if (detail.state.status === "error" || !detail.task) {
    return (
      <DetailFrame variant={variant} onClose={onClose}>
        <EmptyState
          className={panel ? "my-auto" : "pt-20"}
          icon={<Eye />}
          title="Не удалось открыть задачу"
          description={detail.state.status === "error" ? detail.state.message : undefined}
          action={
            <Button variant="accent-outline" className="h-10 rounded-xl px-[18px] text-[15px]" onClick={() => void detail.reload()}>
              Повторить
            </Button>
          }
        />
      </DetailFrame>
    );
  }
  return <TaskCard detail={detail} task={detail.task} todayKey={todayKey} variant={variant} onClose={onClose} onGone={onGone} />;
}

function DetailFrame({ variant, onClose, children }: { variant: TaskDetailProps["variant"]; onClose: () => void; children: ReactNode }) {
  if (variant === "panel") {
    return (
      <div className="relative flex h-full min-h-[320px] flex-col rounded-[18px] bg-ui-surface p-[22px]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть карточку"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-ui-fg/60 hover:bg-ui-fg/[0.06] hover:text-ui-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
        >
          <X className="size-5" aria-hidden />
        </button>
        {children}
      </div>
    );
  }
  return (
    <div className="flex min-h-[100dvh] flex-col gap-4 bg-ui-canvas px-4 pb-8 pt-[max(16px,env(safe-area-inset-top))]">
      <BackLink onClick={onClose} />
      {children}
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1.5 text-lg text-ui-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
    >
      <ChevronLeft className="size-6" aria-hidden />
      Задачи
    </button>
  );
}

type Detail = ReturnType<typeof useTaskDetail>;
type Editor = "due" | "priority" | "reminder" | "transfer" | "delete" | null;

function TaskCard({
  detail,
  task,
  todayKey,
  variant,
  onClose,
  onGone,
}: {
  detail: Detail;
  task: UserTask;
  todayKey: string;
  variant: TaskDetailProps["variant"];
  onClose: () => void;
  onGone: () => void;
}) {
  const panel = variant === "panel";
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const isGuest = useAuthStore((s) => s.isGuest);
  const [editor, setEditor] = useState<Editor>(null);
  const open = (next: Editor) => (value: boolean) => setEditor(value ? next : null);

  const canEdit = canEditUserTaskDetails(task, currentUserId);
  const canDelete = canDeleteUserTask(task, currentUserId);
  const canTransfer = task.task_permissions?.can_transfer === true;
  const readOnly = isReadOnlyTask(task);
  const blockedReason = taskToggleBlockedReason(task);
  const due = taskDue(task);
  const overdue = isTaskOverdue(task);
  const dueText = formatDue(due, todayKey, ", ");
  const recipientLabel = taskRecipientLabel(task, currentUserId);
  const recipient = taskRecipientSummary(task, currentUserId);
  const RecipientIcon = recipient?.icon === "company" ? Building2 : recipient?.icon === "group" ? Users : User;
  const reminderFields = { reminders_disabled: task.reminders_disabled, remind_before_minutes: task.remind_before_minutes };
  const reminderText = due ? reminderLabel(reminderFields) : "Нужен срок";
  const authorName = task.creator_id !== currentUserId ? task.creator?.full_name : null;
  const sectionColors = SECTION_COLORS[variant];
  const rowDensity = panel ? "compact" : "regular";
  const dueValue: DueValue = { due, recurrence: normalizeRecurrenceFromApi(task) };

  const deleteMessage = hasOtherRecipient(task, currentUserId)
    ? `«${task.title}» будет удалена у вас и у исполнителя (${recipientLabel}). Это действие нельзя отменить.`
    : `«${task.title}» будет удалена. Это действие нельзя отменить.`;

  const applyDue = (value: DueValue) =>
    void detail.save({
      scheduled_at: dueToScheduledAt(value.due),
      ...(value.due
        ? value.recurrence
        : { recurrence_type: "none", recurrence_interval: 1, recurrence_custom_unit: null, recurrence_weekdays: null }),
    });

  const transferTo = (selection: RecipientSelection | null) => {
    setEditor(null);
    if (selection && selection.type !== "team") void detail.transfer(selection);
  };

  const completeButton = (
    <div className="flex flex-col gap-1.5">
      <Button
        variant={task.completed ? "raised" : "accent"}
        size={panel ? "md" : "block"}
        className={cn(panel && "w-full")}
        disabled={blockedReason != null || detail.busy === "complete"}
        aria-busy={detail.busy === "complete"}
        onClick={() => void detail.toggleComplete()}
      >
        {detail.busy === "complete" ? <Loader2 className="animate-spin" aria-hidden /> : task.completed ? <RotateCcw aria-hidden /> : <Check aria-hidden />}
        {task.completed ? "Вернуть в работу" : "Отметить выполненной"}
      </Button>
      {blockedReason ? <p className="text-[13px] text-ui-fg/55">{blockedReason}</p> : null}
    </div>
  );

  const dueRow = (
    <ListRow
      icon={<CalendarDays />}
      label="Срок"
      value={dueText}
      valueTone={overdue ? "danger" : "muted"}
      density={rowDensity}
      onClick={canEdit ? () => setEditor("due") : undefined}
      aria-haspopup="dialog"
    />
  );
  const priorityRow = (
    <ListRow
      icon={<Flag />}
      label="Приоритет"
      value={PRIORITY_LABEL[task.priority]}
      density={rowDensity}
      onClick={canEdit ? () => setEditor("priority") : undefined}
      aria-haspopup="listbox"
    />
  );
  const reminderRow = (
    <ListRow
      icon={<Bell />}
      label="Напоминание"
      value={reminderText}
      density={rowDensity}
      onClick={canEdit && due ? () => setEditor("reminder") : undefined}
      aria-haspopup="listbox"
    />
  );

  return (
    <DetailFrame variant={variant} onClose={onClose}>
      <div className={cn("flex flex-col gap-4 [&>*]:shrink-0", panel && "-mr-2 min-h-0 flex-1 overflow-y-auto pr-2")}>
        <div className={cn("flex flex-col gap-2", panel && "pr-10")}>
          <InlineEditText
            value={task.title}
            editable={canEdit}
            label="Название задачи"
            requiredMessage="Введите название задачи"
            maxLength={TASK_TITLE_MAX_LENGTH}
            onSave={(title) => detail.save({ title })}
            className={cn("font-bold text-ui-fg", panel ? "text-[22px] leading-[26px]" : "text-[26px] leading-[31px]")}
          />
          <div className="flex flex-wrap gap-2">
            {task.completed ? (
              <Badge variant="neutral-soft" className="text-ui-done">
                <Check className="size-3.5" aria-hidden />
                Выполнена
              </Badge>
            ) : overdue ? (
              <Badge variant="danger-soft" className="font-semibold">
                Просрочено · {dueText}
              </Badge>
            ) : null}
            {task.priority !== "medium" ? (
              <Badge variant="neutral-soft" className="font-semibold">
                {task.priority === "high" ? <Flag className="size-3 fill-ui-danger text-ui-danger" aria-hidden /> : null}
                {PRIORITY_LABEL[task.priority]}
              </Badge>
            ) : null}
          </div>
        </div>

        {readOnly ? (
          <div className="flex items-start gap-3 rounded-2xl bg-ui-fg/[0.04] px-4 py-3 text-sm text-ui-fg/70">
            <Eye className="mt-0.5 size-5 shrink-0 text-ui-fg/50" aria-hidden />
            Задача передана другому получателю. Вы видите её состояние и историю, но не можете её менять.
          </div>
        ) : null}

        {completeButton}

        <ListGroup tone={panel ? "inset" : "surface"} aria-label="Параметры задачи">
          <ListRow
            icon={<RecipientIcon />}
            label="Исполнитель"
            value={recipientLabel}
            density={rowDensity}
            onClick={canTransfer ? () => setEditor("transfer") : undefined}
            aria-haspopup="dialog"
          />
          {panel ? (
            <TaskDueEditor variant="popover" open={editor === "due"} onOpenChange={open("due")} value={dueValue} onApply={applyDue} todayKey={todayKey}>
              {dueRow}
            </TaskDueEditor>
          ) : (
            dueRow
          )}
          {panel ? (
            <TaskChoicePicker
              variant="popover"
              align="end"
              open={editor === "priority"}
              onOpenChange={open("priority")}
              title="Приоритет"
              value={task.priority}
              options={PRIORITY_CHOICES}
              onChange={(priority) => void detail.save({ priority })}
            >
              {priorityRow}
            </TaskChoicePicker>
          ) : (
            priorityRow
          )}
          {panel ? (
            <TaskChoicePicker
              variant="popover"
              align="end"
              open={editor === "reminder"}
              onOpenChange={open("reminder")}
              title="Напоминание"
              value={reminderValue(reminderFields)}
              options={reminderOptionsFor(reminderFields)}
              onChange={(value) => {
                const option = reminderOptionsFor(reminderFields).find((item) => item.value === value);
                if (option) void detail.save(option.fields);
              }}
            >
              {reminderRow}
            </TaskChoicePicker>
          ) : (
            reminderRow
          )}
          {authorName ? <ListRow icon={<UserRound />} label="Автор" value={authorName} density={rowDensity} /> : null}
        </ListGroup>

        {task.description?.trim() || canEdit ? (
          <div className={cn("flex flex-col gap-1.5", !panel && "rounded-2xl bg-ui-surface px-3.5 py-3")}>
            <p className="text-[13px] font-medium text-ui-fg/50">Описание</p>
            <InlineEditText
              value={task.description ?? ""}
              editable={canEdit}
              multiline
              label="Описание"
              maxLength={TASK_DESCRIPTION_MAX_LENGTH}
              emptyLabel="Добавить описание"
              onSave={(description) => detail.save({ description: description || null })}
              className={cn(panel ? "text-sm leading-[17px] text-ui-fg/85" : "text-base leading-[19px] text-ui-fg")}
            />
          </div>
        ) : null}

        {canTransfer || canDelete ? (
          panel ? (
            <div className="flex flex-wrap gap-[18px]">
              {canTransfer ? (
                <button
                  type="button"
                  onClick={() => setEditor("transfer")}
                  disabled={detail.busy === "transfer"}
                  className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-ui-accent-on-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70 disabled:opacity-50"
                >
                  <ArrowRight className="size-4" aria-hidden />
                  Передать
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => setEditor("delete")}
                  className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-ui-danger hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Удалить
                </button>
              ) : null}
            </div>
          ) : (
            <ListGroup aria-label="Действия">
              {canTransfer ? (
                <ListRow
                  icon={detail.busy === "transfer" ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                  label="Передать задачу"
                  tone="accent"
                  disabled={detail.busy === "transfer"}
                  onClick={() => setEditor("transfer")}
                />
              ) : null}
              {canDelete ? <ListRow icon={<Trash2 />} label="Удалить" tone="danger" chevron={false} onClick={() => setEditor("delete")} /> : null}
            </ListGroup>
          )
        ) : null}

        {!isGuest ? <TaskAttachmentsSection taskId={task.id} canEdit={canEdit} tone={panel ? "inset" : "surface"} /> : null}
        {!isGuest && isGroupTask(task) ? (
          <GroupTaskDetails task={task} currentUserId={currentUserId} colors={sectionColors} onChanged={() => void detail.reload()} />
        ) : null}
        {!isGuest && task.task_permissions?.can_view_history !== false ? <TaskHistorySection task={task} colors={sectionColors} /> : null}
        {!isGuest ? <TaskCommentsSection taskId={task.id} colors={sectionColors} variant="plain" /> : null}
      </div>

      {!panel ? (
        <>
          <TaskDueEditor variant="sheet" open={editor === "due"} onOpenChange={open("due")} value={dueValue} onApply={applyDue} todayKey={todayKey} />
          <TaskChoicePicker
            variant="sheet"
            open={editor === "priority"}
            onOpenChange={open("priority")}
            title="Приоритет"
            value={task.priority}
            options={PRIORITY_CHOICES}
            onChange={(priority) => void detail.save({ priority })}
          />
          <TaskChoicePicker
            variant="sheet"
            open={editor === "reminder"}
            onOpenChange={open("reminder")}
            title="Напоминание"
            value={reminderValue(reminderFields)}
            options={reminderOptionsFor(reminderFields)}
            onChange={(value) => {
              const option = reminderOptionsFor(reminderFields).find((item) => item.value === value);
              if (option) void detail.save(option.fields);
            }}
          />
          <RecipientPickerScreen
            open={editor === "transfer"}
            onOpenChange={open("transfer")}
            value={null}
            mode="transfer"
            title="Передать задачу"
            onSelect={transferTo}
          />
        </>
      ) : (
        <ModalWindow open={editor === "transfer"} onOpenChange={open("transfer")} title="Передать задачу" widthClass="max-w-[520px]">
          {editor === "transfer" ? <RecipientPickerPanel value={null} mode="transfer" density="window" onSelect={transferTo} /> : null}
        </ModalWindow>
      )}

      <ConfirmDialog
        open={editor === "delete"}
        onOpenChange={open("delete")}
        title="Удалить задачу?"
        description={deleteMessage}
        confirmLabel="Удалить"
        busy={detail.busy === "delete"}
        onConfirm={() => {
          void detail.remove().then((deleted) => {
            setEditor(null);
            if (deleted) onGone();
          });
        }}
      />
    </DetailFrame>
  );
}
