"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Bell, CalendarDays, Flag, Loader2, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalWindow } from "@/components/ui/bottom-sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FieldButton, FieldInput, FieldLabel, FieldTextarea } from "@/components/ui/field";
import { ListGroup, ListGroupLabel, ListRow } from "@/components/ui/list-group";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { TaskChoicePicker } from "@/components/tasks/task-choice-picker";
import { TaskDueEditor, type DueValue } from "@/components/tasks/task-due-editor";
import { RecipientCombobox, RecipientPickerScreen } from "@/components/tasks/task-recipient-select";
import type { NewTaskInput } from "@/hooks/use-todo-list";
import { confirmMassAssignment } from "@/lib/group-task-completion";
import { defaultDue, DEFAULT_DUE_TIME, dueToScheduledAt, formatDue } from "@/lib/task-due";
import { defaultRecurrenceNone } from "@/lib/task-recurrence";
import { massAssignmentConfirmText, recipientSelectionLabel, type RecipientSelection } from "@/lib/task-recipients-api";
import { DEFAULT_REMINDER, REMINDER_OPTIONS, reminderLabel } from "@/lib/task-reminders";
import type { TaskPriority, UserTask } from "@/lib/user-tasks-api";
import { TASK_DESCRIPTION_MAX_LENGTH, TASK_TITLE_MAX_LENGTH } from "@/lib/task-fields";
import { confirmAction } from "@/stores/confirm-dialog-store";

export const PRIORITY_OPTIONS: readonly SegmentedOption<TaskPriority>[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий", icon: <Flag aria-hidden className="size-3.5 fill-ui-danger text-ui-danger" /> },
];

const REMINDER_CHOICES = REMINDER_OPTIONS.map((item) => ({ value: item.value, label: item.label }));

type TaskComposerProps = {
  open: boolean;
  onClose: () => void;
  /** «Срок» suggested by the context (a calendar day); the next 18:00 without it. */
  dateKey: string | null;
  todayKey: string;
  onCreate: (input: NewTaskInput) => Promise<UserTask | null>;
  onCreated?: (task: UserTask) => void;
  variant: "screen" | "window";
};

type Draft = {
  title: string;
  description: string;
  recipient: RecipientSelection | null;
  due: DueValue;
  reminder: string;
  priority: TaskPriority;
};

function initialDraft(dateKey: string | null, todayKey: string): Draft {
  return {
    title: "",
    description: "",
    recipient: null,
    due: { due: dateKey ? { dateKey, time: DEFAULT_DUE_TIME } : defaultDue(todayKey), recurrence: defaultRecurrenceNone() },
    reminder: DEFAULT_REMINDER.value,
    priority: "medium",
  };
}

/**
 * «Новая задача» (Figma «Задачи · Новая задача» / «Новая задача (окно)»): title, optional
 * description, «Исполнитель», «Срок», «Напоминание» and «Приоритет». A phone screen or a desktop window.
 */
export function TaskComposer({ open, onClose, dateKey, todayKey, onCreate, onCreated, variant }: TaskComposerProps) {
  const [draft, setDraft] = useState<Draft>(() => initialDraft(dateKey, todayKey));
  const [busy, setBusy] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [picker, setPicker] = useState<"recipient" | "due" | "reminder" | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const ids = { title: useId(), description: useId(), recipient: useId(), titleError: useId() };
  const isWindow = variant === "window";

  useEffect(() => {
    if (!open) return;
    setDraft(initialDraft(dateKey, todayKey));
    setTitleError(null);
    setPicker(null);
    // A fresh draft for every opening; todayKey changing while the form is open keeps the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dateKey]);

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const dirty = draft.title.trim() !== "" || draft.description.trim() !== "";
  const reminderOption = REMINDER_OPTIONS.find((item) => item.value === draft.reminder) ?? DEFAULT_REMINDER;
  const dueText = formatDue(draft.due.due, todayKey, ", ");
  const reminderText = draft.due.due ? reminderLabel(reminderOption.fields) : "Нужен срок";
  const recipientText = draft.recipient ? recipientSelectionLabel(draft.recipient) : "Я";

  const requestClose = async () => {
    if (busy) return;
    if (dirty) {
      const discard = await confirmAction({
        title: "Не сохранять задачу?",
        message: "Введённый текст пропадёт.",
        confirmLabel: "Не сохранять",
        cancelLabel: "Продолжить",
        destructive: true,
      });
      if (!discard) return;
    }
    onClose();
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (busy) return;
    const title = draft.title.trim();
    if (!title) {
      setTitleError("Введите название задачи");
      titleRef.current?.focus();
      return;
    }
    if (!(await confirmMassAssignment(massAssignmentConfirmText(draft.recipient)))) return;
    setBusy(true);
    const created = await onCreate({
      title,
      description: draft.description.trim() || null,
      scheduledAt: dueToScheduledAt(draft.due.due),
      recurrence: draft.due.due ? draft.due.recurrence : defaultRecurrenceNone(),
      remindersDisabled: reminderOption.fields.reminders_disabled,
      remindBeforeMinutes: reminderOption.fields.remind_before_minutes,
      recipient: draft.recipient,
      priority: draft.priority,
    });
    setBusy(false);
    if (!created) return;
    onClose();
    onCreated?.(created);
  };

  const titleProps = {
    id: ids.title,
    value: draft.title,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      update({ title: event.target.value });
      if (titleError) setTitleError(null);
    },
    maxLength: TASK_TITLE_MAX_LENGTH,
    placeholder: "Название задачи",
    "aria-invalid": titleError ? true : undefined,
    "aria-describedby": titleError ? ids.titleError : undefined,
    autoFocus: true,
    enterKeyHint: "next" as const,
  };
  const titleErrorText = titleError ? (
    <p id={ids.titleError} role="alert" className="text-[13px] text-ui-danger">
      {titleError}
    </p>
  ) : null;

  const priorityControl = (className?: string) => (
    <SegmentedControl<TaskPriority>
      ariaLabel="Приоритет"
      tone="neutral"
      fill
      value={draft.priority}
      options={PRIORITY_OPTIONS}
      onChange={(priority) => update({ priority })}
      className={className}
      optionClassName="min-h-[37px] rounded-[10px]"
    />
  );

  const createButton = (size: "block" | "md") => (
    <Button type="submit" form={ids.title + "-form"} variant="accent" size={size} disabled={busy} aria-busy={busy}>
      {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
      Создать задачу
    </Button>
  );

  if (isWindow) {
    return (
      <ModalWindow
        open={open}
        onOpenChange={(next) => {
          if (!next) void requestClose();
        }}
        title="Новая задача"
        widthClass="max-w-[620px]"
        footer={
          <>
            <Button variant="raised" size="md" onClick={() => void requestClose()} disabled={busy}>
              Отмена
            </Button>
            {createButton("md")}
          </>
        }
      >
        <form id={ids.title + "-form"} onSubmit={(event) => void submit(event)} className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={ids.title}>Название</FieldLabel>
            <FieldInput ref={titleRef} {...titleProps} className="h-11 text-base" />
            {titleErrorText}
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={ids.description}>Описание</FieldLabel>
            <FieldTextarea
              id={ids.description}
              value={draft.description}
              onChange={(event) => update({ description: event.target.value })}
              maxLength={TASK_DESCRIPTION_MAX_LENGTH}
              placeholder="Необязательно"
            />
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel id={ids.recipient}>Исполнитель</FieldLabel>
              <RecipientCombobox labelId={ids.recipient} value={draft.recipient} onSelect={(recipient) => update({ recipient })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Срок</FieldLabel>
              <TaskDueEditor
                variant="popover"
                open={picker === "due"}
                onOpenChange={(next) => setPicker(next ? "due" : null)}
                value={draft.due}
                onApply={(due) => update({ due })}
                todayKey={todayKey}
              >
                <FieldButton icon={<CalendarDays />} active={picker === "due"} aria-label={`Срок: ${dueText}`}>
                  {dueText}
                </FieldButton>
              </TaskDueEditor>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Напоминание</FieldLabel>
              <TaskChoicePicker
                variant="popover"
                open={picker === "reminder"}
                onOpenChange={(next) => setPicker(next ? "reminder" : null)}
                title="Напоминание"
                value={draft.reminder}
                options={REMINDER_CHOICES}
                onChange={(reminder) => update({ reminder })}
              >
                <FieldButton
                  icon={<Bell />}
                  active={picker === "reminder"}
                  disabled={!draft.due.due}
                  aria-label={`Напоминание: ${reminderText}`}
                >
                  {reminderText}
                </FieldButton>
              </TaskChoicePicker>
            </div>
            <div className="flex flex-col gap-1.5">
              <ListGroupLabel>Приоритет</ListGroupLabel>
              {priorityControl("rounded-xl bg-ui-fg/[0.03]")}
            </div>
          </div>
        </form>
      </ModalWindow>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) void requestClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="inset-0 left-0 top-0 flex h-[100dvh] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-ui-canvas p-0 text-ui-fg sm:rounded-none data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out"
      >
        <form
          id={ids.title + "-form"}
          onSubmit={(event) => void submit(event)}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))]"
        >
          <div className="relative flex min-h-11 items-center justify-center">
            <button
              type="button"
              onClick={() => void requestClose()}
              disabled={busy}
              className="absolute left-0 min-h-11 text-[17px] text-ui-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70 disabled:opacity-50"
            >
              Отмена
            </button>
            <DialogTitle className="text-[17px] font-semibold tracking-normal text-ui-fg">Новая задача</DialogTitle>
          </div>

          <div className="flex flex-col gap-2.5 rounded-2xl bg-ui-surface p-3.5">
            <label htmlFor={ids.title} className="sr-only">
              Название задачи
            </label>
            <input
              ref={titleRef}
              {...titleProps}
              className="w-full border-b border-ui-fg/[0.08] bg-transparent pb-3 text-xl font-semibold text-ui-fg placeholder:font-normal placeholder:text-ui-fg/40 focus-visible:outline-none"
            />
            {titleErrorText}
            <label htmlFor={ids.description} className="sr-only">
              Описание
            </label>
            <textarea
              id={ids.description}
              value={draft.description}
              onChange={(event) => update({ description: event.target.value })}
              maxLength={TASK_DESCRIPTION_MAX_LENGTH}
              rows={2}
              placeholder="Описание (необязательно)"
              className="min-h-[44px] w-full resize-none bg-transparent text-[15px] text-ui-fg placeholder:text-ui-fg/40 focus-visible:outline-none"
            />
          </div>

          <ListGroup>
            <ListRow
              icon={draft.recipient && draft.recipient.type !== "users" && draft.recipient.type !== "legacy_user" ? <Users /> : <User />}
              label="Исполнитель"
              value={recipientText}
              aria-haspopup="dialog"
              onClick={() => setPicker("recipient")}
            />
            <ListRow icon={<CalendarDays />} label="Срок" value={dueText} aria-haspopup="dialog" onClick={() => setPicker("due")} />
            <ListRow
              icon={<Bell />}
              label="Напоминание"
              value={reminderText}
              aria-haspopup="dialog"
              disabled={!draft.due.due}
              onClick={() => setPicker("reminder")}
            />
          </ListGroup>

          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-medium text-ui-fg/60">Приоритет</p>
            {priorityControl("rounded-xl")}
          </div>
        </form>
        <div className="shrink-0 px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-2">{createButton("block")}</div>

        <RecipientPickerScreen
          open={picker === "recipient"}
          onOpenChange={(next) => setPicker(next ? "recipient" : null)}
          value={draft.recipient}
          onSelect={(recipient) => update({ recipient })}
        />
        <TaskDueEditor
          variant="sheet"
          open={picker === "due"}
          onOpenChange={(next) => setPicker(next ? "due" : null)}
          value={draft.due}
          onApply={(due) => update({ due })}
          todayKey={todayKey}
        />
        <TaskChoicePicker
          variant="sheet"
          open={picker === "reminder"}
          onOpenChange={(next) => setPicker(next ? "reminder" : null)}
          title="Напоминание"
          value={draft.reminder}
          options={REMINDER_CHOICES}
          onChange={(reminder) => update({ reminder })}
        />
      </DialogContent>
    </Dialog>
  );
}
