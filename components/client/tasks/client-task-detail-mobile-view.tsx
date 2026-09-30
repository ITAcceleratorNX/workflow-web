"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flag,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
  User,
  Users,
  CheckCircle2,
  Eye,
  Forward,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { TaskTeamPickerOverlay } from "@/components/tasks/task-assignment-pickers";
import { GroupTaskDetails } from "@/components/tasks/group-task-details";
import { TaskHistorySection } from "@/components/tasks/task-history-section";
import { TaskRecipientPicker } from "@/components/tasks/task-recipient-picker";
import { TaskCommentsSection } from "@/components/task-comments/task-comments-section";
import { TaskOptionPicker } from "@/components/tasks/task-option-picker";
import type { TaskPickerVariant } from "@/components/tasks/task-picker-shell";
import { TaskScheduleSheet } from "@/components/tasks/task-schedule-sheet";
import { useToast } from "@/hooks/use-toast";
import { useTeams } from "@/hooks/use-teams";
import { useTodoList } from "@/hooks/use-todo-list";
import { MOBILE_COLORS } from "@/constants/mobile-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  formatRequestDate,
  addCalendarDaysToDateKey,
  todayTaskDateKey,
  formatTaskTime,
  toAppDateKey,
  toUtcIsoFromAppDateTime,
} from "@/lib/dateTimeUtils";
import {
  defaultRecurrenceNone,
  formatRecurrenceSummaryCompactRu,
  normalizeRecurrenceFromApi,
  type TaskRecurrencePayload,
} from "@/lib/task-recurrence";
import {
  canEditUserTaskDetails,
  deleteUserTaskAttachment,
  getUserTask,
  getUserTaskAttachments,
  transferUserTask,
  uploadUserTaskAttachments,
  type TaskPriority,
  type UserTask,
  type UserTaskAttachment,
} from "@/lib/user-tasks-api";
import {
  confirmTaskTransfer,
  isGroupTask,
  isReadOnlyTask,
  taskToggleBlockedReason,
} from "@/lib/group-task-completion";
import { toTransferInput, transferRecipientLabel, type RecipientSelection } from "@/lib/task-recipients-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserTasksInvalidateStore } from "@/stores/user-tasks-invalidate-store";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/stores/confirm-dialog-store";

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
];

const TITLE_SAVE_DEBOUNCE_MS = 450;

function isoForDateTime(dateKey: string, time: string) {
  return toUtcIsoFromAppDateTime(dateKey, time);
}

function getExecutorFromTask(t: UserTask): { id: number; full_name: string } | null {
  if (t.executor_id && t.executor?.full_name) {
    return { id: t.executor_id, full_name: t.executor.full_name };
  }
  if (t.assignees && t.assignees.length > 0) {
    return { id: t.assignees[0].id, full_name: t.assignees[0].full_name };
  }
  if (t.assignee_ids?.length) {
    const id = t.assignee_ids[0];
    const fromAssignees = t.assignees?.find((a) => a.id === id);
    return { id, full_name: fromAssignees?.full_name ?? `Пользователь #${id}` };
  }
  return null;
}

function buildRemindTimingSelectValue(t: UserTask): string {
  const m = t.remind_before_minutes;
  if (m == null) return "default";
  return `before_${m}`;
}

function buildRemindTimingSelectOptions(t: UserTask): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [
    { value: "default", label: "По умолчанию" },
    { value: "before_5", label: "За 5 мин до срока" },
    { value: "before_15", label: "За 15 мин до срока" },
    { value: "before_30", label: "За 30 мин до срока" },
  ];
  const m = t.remind_before_minutes;
  if (m != null && ![5, 15, 30].includes(m)) {
    opts.push({ value: `before_${m}`, label: `За ${m} мин до срока` });
  }
  return opts;
}

export type ClientTaskDetailViewLayout = "mobile" | "desktop";

type ClientTaskDetailMobileViewProps = {
  taskId: number;
  layout?: ClientTaskDetailViewLayout;
};

export function ClientTaskDetailMobileView({
  taskId,
  layout = "mobile",
}: ClientTaskDetailMobileViewProps) {
  const isDesktopLayout = layout === "desktop";
  const pickerVariant: TaskPickerVariant = isDesktopLayout ? "dialog" : "sheet";
  const router = useRouter();

  const navigateBack = useCallback(() => {
    if (isDesktopLayout) {
      router.push("/client/tasks");
      return;
    }
    router.back();
  }, [isDesktopLayout, router]);
  const { toast } = useToast();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const isGuest = useAuthStore((s) => s.isGuest);
  const { teams, loading: teamsLoading } = useTeams();
  const tasksInvalidateVersion = useUserTasksInvalidateStore((s) => s.version);
  const bumpTasks = useUserTasksInvalidateStore((s) => s.bump);

  const colorScheme = useColorScheme();
  const theme = MOBILE_COLORS[isDesktopLayout ? "dark" : colorScheme];
  const background = theme.background;
  const text = theme.text;
  const textMuted = theme.textMuted;
  const primary = theme.primary;
  const cardBg = theme.cardBackground;
  const border = theme.border;

  const { tasks, updateTask, removeTask, toggleComplete } = useTodoList({
    filter: "all",
    enabled: false,
  });

  const [fetchedTask, setFetchedTask] = useState<UserTask | null>(null);
  const [loadingTask, setLoadingTask] = useState(false);

  const listedTask = tasks.find((t) => t.id === taskId);
  const task = listedTask ?? (fetchedTask?.id === taskId ? fetchedTask : null);

  useEffect(() => {
    if (isGuest) {
      setFetchedTask(null);
      setLoadingTask(false);
      return;
    }
    if (listedTask) {
      setFetchedTask(null);
      setLoadingTask(false);
      return;
    }
    let cancelled = false;
    setLoadingTask(true);
    void getUserTask(taskId).then((res) => {
      if (cancelled) return;
      if (res.ok) setFetchedTask(res.data);
      else {
        toast({ title: "Ошибка", description: res.error, variant: "destructive" });
        navigateBack();
      }
      setLoadingTask(false);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId, isGuest, listedTask, tasksInvalidateVersion, navigateBack, toast]);

  const canEditDetails = !!task && canEditUserTaskDetails(task, currentUserId);

  const notifyCreatorOnly = useCallback(() => {
    toast({
      title: "Нет прав на редактирование",
      description:
        "Менять детали могут создатель задачи или руководитель команды. Вы можете отметить выполнение.",
      duration: 4000,
    });
  }, [toast]);

  const [titleDraft, setTitleDraft] = useState("");
  const [titleSaveError, setTitleSaveError] = useState<string | null>(null);
  const [titleSaving, setTitleSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const titleSavePromise = useRef<Promise<boolean> | null>(null);
  const confirmedTitle = useRef<{ id: number; title: string } | null>(null);
  const deletedTask = useRef(false);
  const taskRef = useRef(task);
  const canEditDetailsRef = useRef(canEditDetails);
  const titleDraftRef = useRef(titleDraft);
  const completeToggleBusyRef = useRef(false);
  useLayoutEffect(() => {
    taskRef.current = task;
    canEditDetailsRef.current = canEditDetails;
    titleDraftRef.current = titleDraft;
  }, [task, canEditDetails, titleDraft]);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleDraftDate, setScheduleDraftDate] = useState<string | null>(null);
  const [scheduleDraftTime, setScheduleDraftTime] = useState("09:00");
  const [scheduleCalendarMonth, setScheduleCalendarMonth] = useState(() => new Date());
  const [scheduleDraftRecurrence, setScheduleDraftRecurrence] = useState<TaskRecurrencePayload>(() =>
    defaultRecurrenceNone(),
  );

  const [priorityPickerOpen, setPriorityPickerOpen] = useState(false);
  const [priorityPickerDraft, setPriorityPickerDraft] = useState<TaskPriority>("medium");
  const [remindTimingPickerOpen, setRemindTimingPickerOpen] = useState(false);
  const [remindTimingPickerDraft, setRemindTimingPickerDraft] = useState("default");

  const [pickerSheet, setPickerSheet] = useState<"team" | "transfer" | null>(null);
  const [transferBusy, setTransferBusy] = useState(false);

  const [attachments, setAttachments] = useState<UserTaskAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadedTaskId = task?.id;
  const savedTitle = task?.title ?? "";
  const titleTaskId = useRef<number | undefined>(undefined);
  useLayoutEffect(() => {
    if (loadedTaskId === undefined || titleTaskId.current === loadedTaskId) return;
    titleTaskId.current = loadedTaskId;
    confirmedTitle.current = { id: loadedTaskId, title: savedTitle };
    titleDraftRef.current = savedTitle;
    setTitleDraft(savedTitle);
    setTitleSaveError(null);
    deletedTask.current = false;
  }, [loadedTaskId, savedTitle]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!task?.id) {
        setAttachments([]);
        setAttachmentsLoading(false);
        return;
      }
      setAttachmentsLoading(true);
      const res = await getUserTaskAttachments(task.id);
      if (cancelled) return;
      if (res.ok) setAttachments(res.data);
      else {
        setAttachments([]);
        toast({ title: "Ошибка загрузки", description: res.error, variant: "destructive" });
      }
      setAttachmentsLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [task?.id, toast]);

  const flushTitleToServer = useCallback(async () => {
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = null;
    }
    while (titleSavePromise.current) {
      if (!(await titleSavePromise.current)) return false;
    }
    const t = taskRef.current;
    if (!t || !canEditDetailsRef.current || deletedTask.current) return true;
    const next = titleDraftRef.current.trim();
    if (!next) {
      setTitleSaveError("Введите название задачи перед сохранением.");
      return false;
    }
    if (confirmedTitle.current?.id === t.id && next === confirmedTitle.current.title) {
      setTitleSaveError(null);
      return true;
    }
    setTitleSaving(true);
    setTitleSaveError(null);
    const save = (async () => {
      try {
        const updated = await updateTask(t, { title: next });
        if (!updated) {
          if (taskRef.current?.id === t.id) setTitleSaveError("Название не сохранено. Повторите попытку.");
          return false;
        }
        if (taskRef.current?.id === t.id) {
          const title = updated.title ?? next;
          confirmedTitle.current = { id: t.id, title };
          taskRef.current = { ...t, ...updated, title };
          setFetchedTask((current) => current?.id === t.id ? { ...current, ...updated, title } : current);
          if (titleDraftRef.current.trim() === next) {
            titleDraftRef.current = title;
            setTitleDraft(title);
          }
        }
        return true;
      } catch {
        if (taskRef.current?.id === t.id) setTitleSaveError("Название не сохранено. Повторите попытку.");
        return false;
      } finally {
        titleSavePromise.current = null;
        setTitleSaving(false);
      }
    })();
    titleSavePromise.current = save;
    return save;
  }, [updateTask]);

  const handleBack = useCallback(async () => {
    if (leavingRef.current || deleteLock.current) return;
    leavingRef.current = true;
    setLeaving(true);
    try {
      if (await flushTitleToServer()) navigateBack();
    } finally {
      leavingRef.current = false;
      setLeaving(false);
    }
  }, [flushTitleToServer, navigateBack]);

  const scheduleTitleSave = useCallback(() => {
    if (!canEditDetailsRef.current) return;
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      titleDebounceRef.current = null;
      void flushTitleToServer();
    }, TITLE_SAVE_DEBOUNCE_MS);
  }, [flushTitleToServer]);

  useEffect(() => {
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = null;
    }
  }, [task?.id]);

  useEffect(() => {
    return () => {
      void flushTitleToServer();
    };
  }, [flushTitleToServer]);

  const handleToggleSchedule = useCallback(async () => {
    if (!task || !canEditDetails) return;
    if (task.scheduled_at) {
      await updateTask(task, {
        scheduled_at: null,
        recurrence_type: "none",
        recurrence_interval: 1,
        recurrence_custom_unit: null,
        recurrence_weekdays: null,
      });
      return;
    }
    const nowPlus15Min = new Date(Date.now() + 15 * 60 * 1000);
    await updateTask(task, {
      scheduled_at: isoForDateTime(toAppDateKey(nowPlus15Min), formatTaskTime(nowPlus15Min)),
    });
  }, [task, canEditDetails, updateTask]);

  const handleToggleReminders = useCallback(async () => {
    if (!task || !canEditDetails) return;
    await updateTask(task, { reminders_disabled: !task.reminders_disabled });
  }, [task, canEditDetails, updateTask]);

  const openScheduleModal = useCallback(() => {
    if (!task) return;
    if (!canEditDetails) {
      notifyCreatorOnly();
      return;
    }
    const dateKey = task.scheduled_at ? toAppDateKey(task.scheduled_at) : null;
    const time = task.scheduled_at ? formatTaskTime(task.scheduled_at) : "09:00";
    setScheduleDraftDate(dateKey);
    setScheduleDraftTime(time);
    const base = new Date((dateKey ?? toAppDateKey(new Date())) + "T12:00:00");
    setScheduleCalendarMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setScheduleDraftRecurrence(normalizeRecurrenceFromApi(task));
    setScheduleModalOpen(true);
  }, [task, canEditDetails, notifyCreatorOnly]);

  const applyScheduleModal = useCallback(async () => {
    if (!task || !canEditDetails) return;
    const r = scheduleDraftRecurrence;
    const hasDate = !!scheduleDraftDate;
    await updateTask(task, {
      scheduled_at: scheduleDraftDate ? isoForDateTime(scheduleDraftDate, scheduleDraftTime) : null,
      recurrence_type: hasDate ? r.recurrence_type : "none",
      recurrence_interval: hasDate ? r.recurrence_interval : 1,
      recurrence_custom_unit: hasDate ? r.recurrence_custom_unit : null,
      recurrence_weekdays: hasDate ? r.recurrence_weekdays : null,
    });
    setScheduleModalOpen(false);
  }, [task, canEditDetails, scheduleDraftDate, scheduleDraftTime, scheduleDraftRecurrence, updateTask]);

  const applyReminderTimingFromPicker = useCallback(
    async (val: string) => {
      const t = taskRef.current;
      if (!t || !canEditDetailsRef.current || t.reminders_disabled) return;
      if (val === "default") {
        await updateTask(t, { remind_before_minutes: null, remind_at: null });
        return;
      }
      if (val.startsWith("before_")) {
        const mins = parseInt(val.slice("before_".length), 10);
        if (!Number.isFinite(mins)) return;
        await updateTask(t, { remind_before_minutes: mins, remind_at: null });
      }
    },
    [updateTask],
  );

  const applyPriorityFromPicker = useCallback(
    async (next: TaskPriority) => {
      const t = taskRef.current;
      if (!t || !canEditDetailsRef.current) return;
      if (!PRIORITY_OPTIONS.some((o) => o.value === next)) return;
      await updateTask(t, { priority: next });
    },
    [updateTask],
  );

  const handleCompleteSwitch = useCallback(async () => {
    const t = taskRef.current;
    if (!t || completeToggleBusyRef.current) return;
    completeToggleBusyRef.current = true;
    try {
      await toggleComplete(t);
    } finally {
      completeToggleBusyRef.current = false;
    }
  }, [toggleComplete]);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!task || !canEditDetails || attachmentsUploading) return;
      const list = Array.from(files).slice(0, 10);
      if (list.length === 0) return;
      setAttachmentsUploading(true);
      const res = await uploadUserTaskAttachments(task.id, list);
      if (res.ok) {
        setAttachments((prev) => [...res.data, ...prev]);
        toast({ title: "Готово", description: "Вложения загружены", duration: 2500 });
      } else {
        toast({ title: "Ошибка загрузки", description: res.error, variant: "destructive" });
      }
      setAttachmentsUploading(false);
    },
    [task, canEditDetails, attachmentsUploading, toast],
  );

  const handleDeleteAttachment = useCallback(
    async (attachmentId: number) => {
      if (!task || !canEditDetails) return;
      const before = attachments;
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      const res = await deleteUserTaskAttachment(task.id, attachmentId);
      if (!res.ok) {
        setAttachments(before);
        toast({ title: "Ошибка удаления", description: res.error, variant: "destructive" });
      }
    },
    [task, canEditDetails, attachments, toast],
  );

  const applyTeam = useCallback(
    async (nextTeamId: number | null) => {
      if (!task || !canEditDetails) return;
      await updateTask(task, {
        team_id: nextTeamId,
        executor_id: null,
        assignee_ids: [],
        assignees: [],
        executor: undefined,
      });
    },
    [task, canEditDetails, updateTask],
  );

  const canTransfer = task?.task_permissions?.can_transfer === true;

  /** «Передать задачу»: выбор, как в поле «Исполнитель», затем подтверждение нового получателя. */
  const openTransfer = useCallback(() => {
    if (!canTransfer || transferBusy) return;
    setPickerSheet("transfer");
  }, [canTransfer, transferBusy]);

  const handleTransferSelect = useCallback(
    async (selection: RecipientSelection | null) => {
      setPickerSheet(null);
      const t = taskRef.current;
      if (!t || !selection) return;
      const label = transferRecipientLabel(selection);
      // «Отмена» — получатель и состояние задачи не меняются.
      if (!(await confirmTaskTransfer(label))) return;
      setTransferBusy(true);
      const res = await transferUserTask(t.id, toTransferInput(selection));
      setTransferBusy(false);
      if (!res.ok) {
        toast({ title: "Не удалось передать задачу", description: res.error, variant: "destructive", duration: 4000 });
        return;
      }
      toast({ title: "Задача передана", description: label, duration: 2500 });
      bumpTasks();
      if (res.data) setFetchedTask(res.data);
      else navigateBack();
    },
    [bumpTasks, navigateBack, toast],
  );

  /** Исполнитель меняется только передачей: с подтверждением и записью в историю. */
  const onExecutorRowPress = useCallback(() => {
    if (canTransfer) {
      openTransfer();
      return;
    }
    toast({
      title: "Передача недоступна",
      description: task?.completed
        ? "Выполненную задачу сначала верните в работу."
        : "Передать задачу может автор или текущий исполнитель.",
      duration: 4000,
    });
  }, [canTransfer, openTransfer, toast, task?.completed]);

  const effectiveExecutor = useMemo(() => (task ? getExecutorFromTask(task) : null), [task]);
  const executorRowSummary = effectiveExecutor?.full_name ?? "—";

  const completedByName = useMemo(() => {
    if (!task?.completed) return null;
    const u = task.completed_by_user ?? task.completedByUser;
    return u?.full_name ?? null;
  }, [task]);

  const remindTimingSelectOptions = useMemo(() => {
    if (!task) return [];
    return buildRemindTimingSelectOptions(task);
  }, [task]);

  const remindTimingSummaryLabel = useMemo(() => {
    if (!task) return "";
    const v = buildRemindTimingSelectValue(task);
    const fromList = remindTimingSelectOptions.find((o) => o.value === v)?.label;
    if (fromList) return fromList;
    if (task.remind_at) return formatRequestDate(task.remind_at);
    return "По умолчанию";
  }, [task, remindTimingSelectOptions]);

  const prioritySummaryLabel = useMemo(() => {
    if (!task) return "";
    return PRIORITY_OPTIONS.find((o) => o.value === task.priority)?.label ?? "";
  }, [task]);

  const groupTask = isGroupTask(task);
  const readOnly = isReadOnlyTask(task);
  const completeBlockedReason = task ? taskToggleBlockedReason(task) : null;
  const detailColors = { text, textMuted, primary, cardBg, border };

  const [todayKey, setTodayKey] = useState(todayTaskDateKey);
  useEffect(() => {
    const refreshDay = () => setTodayKey(todayTaskDateKey());
    const timer = window.setInterval(refreshDay, 60_000);
    window.addEventListener("focus", refreshDay);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshDay);
    };
  }, []);
  const tomorrowKey = addCalendarDaysToDateKey(todayKey, 1);

  const scheduledEnabled = !!task?.scheduled_at;
  const scheduledPrimaryLine = task?.scheduled_at
    ? `${toAppDateKey(task.scheduled_at)} · ${formatTaskTime(task.scheduled_at)}`
    : "Без срока";
  const repeatHint =
    task?.scheduled_at && task.recurrence_type && task.recurrence_type !== "none"
      ? formatRecurrenceSummaryCompactRu(normalizeRecurrenceFromApi(task), {
          anchorDateKey: toAppDateKey(task.scheduled_at),
        })
      : "";


  if (!task) {
    return (
      <div
        className={cn(isDesktopLayout ? "pb-2" : "min-h-screen")}
        style={isDesktopLayout ? undefined : { backgroundColor: background }}
      >
        {!isDesktopLayout && (
          <>
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: primary }} />
            </div>
            <Header title="Подробно" text={text} onBack={() => void handleBack()} backDisabled={leaving || deleting} />
          </>
        )}
        {isDesktopLayout && (
          <button type="button" disabled={leaving || deleting} onClick={() => void handleBack()} className="inline-flex min-h-11 items-center gap-1 text-sm text-[#E25B21] disabled:opacity-50">
            <ChevronLeft className="h-5 w-5" /> К списку задач
          </button>
        )}
        <div className="flex justify-center py-16">
          {loadingTask ? (
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: primary }} />
          ) : (
            <span style={{ color: textMuted }}>Задача не найдена</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(isDesktopLayout ? "pb-2" : "min-h-screen pb-8")}
      style={isDesktopLayout ? undefined : { backgroundColor: background }}
    >
      {!isDesktopLayout && (
        <>
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: primary }} />
          </div>
          <Header title="Подробно" text={text} onBack={() => void handleBack()} backDisabled={leaving || deleting} />
        </>
      )}

      <div
        className={cn(
          "space-y-4",
          isDesktopLayout ? "max-w-3xl" : "px-4",
        )}
      >
        {isDesktopLayout && (
          <button type="button" disabled={leaving || deleting} onClick={() => void handleBack()} className="inline-flex min-h-11 items-center gap-1 text-sm text-[#E25B21] disabled:opacity-50">
            <ChevronLeft className="h-5 w-5" /> К списку задач
          </button>
        )}
        <div
          className={cn(
            "rounded-2xl border p-4",
            isDesktopLayout && "lg:p-5",
          )}
          style={{ backgroundColor: cardBg, borderColor: border }}
        >
          <textarea
            value={titleDraft}
            onChange={(e) => {
              titleDraftRef.current = e.target.value;
              setTitleDraft(e.target.value);
              scheduleTitleSave();
            }}
            onBlur={() => void flushTitleToServer()}
            onClick={() => {
              if (!canEditDetails) notifyCreatorOnly();
            }}
            readOnly={!canEditDetails || leaving || deleting}
            rows={3}
            placeholder="Название и описание"
            className="task-title-input w-full bg-transparent text-lg font-medium outline-none resize-none min-h-[4rem]"
            style={{ color: canEditDetails ? text : textMuted }}
          />
          {titleSaving && <p role="status" className="mt-2 text-sm" style={{ color: textMuted }}>Сохраняем название…</p>}
          {titleSaveError && (
            <div role="alert" className="mt-2 space-y-2 text-sm text-red-500">
              <p>{titleSaveError}</p>
              <button type="button" disabled={titleSaving || leaving} onClick={() => void flushTitleToServer()} className="min-h-11 rounded-lg border border-current px-3 disabled:opacity-50">Повторить сохранение</button>
            </div>
          )}
        </div>

        {readOnly ? (
          <div
            className="flex items-start gap-3 rounded-2xl border px-4 py-3"
            style={{ backgroundColor: isDesktopLayout ? "#2C2C2E" : cardBg, borderColor: border }}
          >
            <Eye className="h-5 w-5 shrink-0 mt-0.5" style={{ color: textMuted }} />
            <p className="text-sm leading-relaxed" style={{ color: textMuted }}>
              Задача передана другому получателю. Вы видите её текущее состояние и историю, но не можете менять
              статус.
            </p>
          </div>
        ) : null}

        <SectionLabel text={textMuted} desktop={isDesktopLayout}>Вложения</SectionLabel>
        <Card border={border} cardBg={cardBg} desktop={isDesktopLayout}>
          {canEditDetails ? (
            <div className="flex gap-2 p-3 border-b" style={{ borderColor: border }}>
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) void uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) void uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={attachmentsUploading}
                onClick={() => mediaInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium min-h-11"
                style={{ borderColor: border, color: primary, opacity: attachmentsUploading ? 0.6 : 1 }}
              >
                <ImageIcon className="h-4 w-4" />
                Фото/Видео
              </button>
              <button
                type="button"
                disabled={attachmentsUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium min-h-11"
                style={{ borderColor: border, color: primary, opacity: attachmentsUploading ? 0.6 : 1 }}
              >
                <Paperclip className="h-4 w-4" />
                Файлы
              </button>
            </div>
          ) : null}

          {attachmentsLoading ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: primary }} />
              <span className="text-xs mt-2" style={{ color: textMuted }}>
                Загрузка…
              </span>
            </div>
          ) : attachments.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Paperclip className="h-7 w-7" style={{ color: textMuted }} />
              <span className="text-sm mt-2 text-center" style={{ color: textMuted }}>
                Пока нет вложений
              </span>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: border }}>
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3">
                  <a
                    href={a.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 flex-1 min-w-0 min-h-11"
                  >
                    {a.file_kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.file_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg border flex items-center justify-center shrink-0"
                        style={{ borderColor: border }}
                      >
                        <FileText className="h-5 w-5" style={{ color: textMuted }} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: text }}>
                        {a.file_name ||
                          (a.file_kind === "video" ? "Видео" : a.file_kind === "image" ? "Фото" : "Файл")}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                        {a.file_kind === "video" ? "Видео" : a.file_kind === "image" ? "Фото" : "Документ"}
                      </p>
                    </div>
                  </a>
                  {canEditDetails ? (
                    <button
                      type="button"
                      onClick={() => void handleDeleteAttachment(a.id)}
                      className="p-2 min-h-11 min-w-11"
                      aria-label="Удалить вложение"
                    >
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>

        <SectionLabel text={textMuted} desktop={isDesktopLayout}>Срок</SectionLabel>
        <Card border={border} cardBg={cardBg} desktop={isDesktopLayout}>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (!canEditDetails) notifyCreatorOnly();
                else openScheduleModal();
              }}
              className={cn(
                "flex-1 flex items-center gap-3 p-3 min-h-11 text-left transition-colors",
                isDesktopLayout && canEditDetails && "rounded-lg hover:bg-white/[0.04]",
              )}
              style={{ opacity: canEditDetails ? 1 : 0.75 }}
            >
              <Calendar className="h-5 w-5 shrink-0" style={{ color: textMuted }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: text }}>
                  Срок
                </p>
                <p
                  className="text-sm truncate"
                  style={{
                    color: textMuted,
                    textDecoration: canEditDetails ? "underline" : "none",
                  }}
                >
                  {scheduledPrimaryLine}
                </p>
                {repeatHint ? (
                  <p className="text-xs truncate mt-0.5" style={{ color: textMuted }}>
                    {repeatHint}
                  </p>
                ) : null}
              </div>
            </button>
            <div className="pr-3">
              <Switch
                checked={scheduledEnabled}
                onCheckedChange={() => void handleToggleSchedule()}
                disabled={!canEditDetails}
              />
            </div>
          </div>
        </Card>

        {!isGuest && groupTask ? (
          <GroupTaskDetails
            task={task}
            currentUserId={currentUserId}
            colors={detailColors}
            desktop={isDesktopLayout}
            onChanged={bumpTasks}
          />
        ) : null}

        {!isGuest && !groupTask ? (
          <>
            <SectionLabel text={textMuted} desktop={isDesktopLayout}>Организация</SectionLabel>
            <Card border={border} cardBg={cardBg} desktop={isDesktopLayout}>
              <RowButton
                icon={<Users className="h-5 w-5" style={{ color: textMuted }} />}
                label="Команда"
                value={task.team?.name ?? "—"}
                onClick={() => {
                  if (!canEditDetails) notifyCreatorOnly();
                  else setPickerSheet("team");
                }}
                canEdit={canEditDetails}
                text={text}
                textMuted={textMuted}
                desktop={isDesktopLayout}
              />
              <Divider border={border} />
              <RowButton
                icon={<User className="h-5 w-5" style={{ color: textMuted }} />}
                label="Исполнитель"
                value={executorRowSummary}
                onClick={onExecutorRowPress}
                canEdit={canTransfer}
                text={text}
                textMuted={textMuted}
                desktop={isDesktopLayout}
              />
              {task.team_id && task.completed && completedByName ? (
                <>
                  <Divider border={border} />
                  <RowStatic
                    icon={<CheckCircle2 className="h-5 w-5" style={{ color: textMuted }} />}
                    label="Завершил"
                    value={completedByName}
                    text={text}
                    textMuted={textMuted}
                  />
                </>
              ) : null}
            </Card>
          </>
        ) : null}

        {!isGuest ? <TaskHistorySection task={task} colors={detailColors} desktop={isDesktopLayout} /> : null}

        <SectionLabel text={textMuted} desktop={isDesktopLayout}>Приоритет</SectionLabel>
        <Card border={border} cardBg={cardBg} desktop={isDesktopLayout}>
          <RowButton
            icon={<Flag className="h-5 w-5" style={{ color: textMuted }} />}
            label="Уровень"
            value={prioritySummaryLabel}
            onClick={() => {
              if (!canEditDetails) notifyCreatorOnly();
              else {
                setPriorityPickerDraft(task.priority ?? "medium");
                setPriorityPickerOpen(true);
              }
            }}
            canEdit={canEditDetails}
            text={text}
            textMuted={textMuted}
            underline
            desktop={isDesktopLayout}
          />
        </Card>

        <SectionLabel text={textMuted} desktop={isDesktopLayout}>Напоминания</SectionLabel>
        <Card border={border} cardBg={cardBg} desktop={isDesktopLayout}>
          <div className="flex items-center p-3">
            <div className="flex items-center gap-3 flex-1">
              <Bell className="h-5 w-5" style={{ color: textMuted }} />
              <span className="text-sm font-medium" style={{ color: text }}>
                Включить напоминания
              </span>
            </div>
            <Switch
              checked={!task.reminders_disabled}
              onCheckedChange={() => void handleToggleReminders()}
              disabled={!canEditDetails}
            />
          </div>
          <div className="px-3 pb-2">
            <p className="text-xs" style={{ color: textMuted }}>
              Пуш по времени в календаре или по кнопке в уведомлении
            </p>
          </div>
          <Divider border={border} />
          <RowButton
            icon={<AlarmClock className="h-5 w-5" style={{ color: textMuted }} />}
            label="Когда напомнить"
            value={remindTimingSummaryLabel}
            onClick={() => {
              if (!canEditDetails) notifyCreatorOnly();
              else if (!task.reminders_disabled) {
                setRemindTimingPickerDraft(buildRemindTimingSelectValue(task));
                setRemindTimingPickerOpen(true);
              }
            }}
            canEdit={canEditDetails && !task.reminders_disabled}
            text={text}
            textMuted={textMuted}
            underline
            desktop={isDesktopLayout}
          />
          <div className="px-3 py-2 border-t" style={{ borderColor: border }}>
            <p className="text-xs" style={{ color: textMuted }}>
              {task.scheduled_at
                ? `Напоминание «за N минут» считается от времени срока: ${scheduledPrimaryLine}`
                : "Без срока в календаре используется системная логика напоминаний."}
            </p>
          </div>
        </Card>

        <Card border={border} cardBg={cardBg} desktop={isDesktopLayout}>
          <div className="flex items-center p-3">
            <div className="flex items-center gap-3 flex-1">
              <Check className="h-5 w-5" style={{ color: textMuted }} />
              <span className="text-sm font-medium" style={{ color: text }}>
                Выполнено
              </span>
            </div>
            <Switch
              checked={task.completed}
              onCheckedChange={() => void handleCompleteSwitch()}
              disabled={completeBlockedReason != null}
            />
          </div>
          {completeBlockedReason ? (
            <div className="px-3 pb-2.5">
              <p className="text-xs" style={{ color: textMuted }}>
                {completeBlockedReason}
              </p>
            </div>
          ) : null}
          {canTransfer ? (
            <>
              <Divider border={border} />
              <button
                type="button"
                disabled={transferBusy}
                onClick={openTransfer}
                className={cn(
                  "w-full flex items-center gap-3 p-3 min-h-11 transition-colors",
                  isDesktopLayout && "rounded-lg hover:bg-white/[0.04]",
                )}
              >
                <Forward className="h-5 w-5" style={{ color: primary }} />
                <span className="flex-1 text-left text-sm font-medium" style={{ color: primary }}>
                  Передать задачу
                </span>
                {transferBusy ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: primary }} /> : null}
              </button>
            </>
          ) : null}
          <Divider border={border} />
          <button
            type="button"
            disabled={!canEditDetails || deleting || leaving}
            onClick={async () => {
              if (!canEditDetails || deleteLock.current || leavingRef.current) return;
              deleteLock.current = true;
              try {
                if (!(await confirmAction({
                  title: "Удалить задачу?",
                  message: `Задача «${task.title}» будет удалена. Это действие нельзя отменить.`,
                  confirmLabel: "Удалить",
                  cancelLabel: "Отмена",
                  destructive: true,
                }))) return;
                setDeleting(true);
                if (titleDebounceRef.current) {
                  clearTimeout(titleDebounceRef.current);
                  titleDebounceRef.current = null;
                }
                if (titleSavePromise.current) await titleSavePromise.current;
                if (await removeTask(task)) {
                  deletedTask.current = true;
                  navigateBack();
                }
              } finally {
                deleteLock.current = false;
                setDeleting(false);
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 p-3 min-h-11 transition-colors",
              isDesktopLayout && "rounded-lg hover:bg-red-500/10",
            )}
            style={{ opacity: canEditDetails ? 1 : 0.45 }}
          >
            <Trash2 className="h-5 w-5 text-red-400" />
            <span className="text-sm font-medium text-red-400">Удалить задачу</span>
          </button>
        </Card>

        {!isGuest ? <TaskCommentsSection taskId={task.id} colors={detailColors} desktop={isDesktopLayout} /> : null}
      </div>

      <TaskScheduleSheet
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onConfirm={() => void applyScheduleModal()}
        variant={pickerVariant}
        todayKey={todayKey}
        tomorrowKey={tomorrowKey}
        scheduledDate={scheduleDraftDate}
        onScheduledDateChange={setScheduleDraftDate}
        scheduledTime={scheduleDraftTime}
        onScheduledTimeChange={setScheduleDraftTime}
        calendarMonth={scheduleCalendarMonth}
        onCalendarMonthChange={setScheduleCalendarMonth}
        recurrence={scheduleDraftRecurrence}
        onRecurrenceChange={setScheduleDraftRecurrence}
      />

      <TaskTeamPickerOverlay
        visible={pickerSheet === "team"}
        onClose={() => setPickerSheet(null)}
        teams={teams}
        loading={teamsLoading}
        selectedTeamId={task.team_id ?? null}
        onSelect={(id) => void applyTeam(id)}
        variant={pickerVariant}
      />

      <TaskRecipientPicker
        visible={pickerSheet === "transfer"}
        onClose={() => setPickerSheet(null)}
        currentUserId={currentUserId}
        value={null}
        title="Передать задачу"
        onConfirm={(selection) => void handleTransferSelect(selection)}
        variant={pickerVariant}
      />

      <TaskOptionPicker
        open={priorityPickerOpen}
        title="Приоритет"
        options={PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selected={priorityPickerDraft}
        onSelect={(v) => setPriorityPickerDraft(v as TaskPriority)}
        onClose={() => setPriorityPickerOpen(false)}
        onConfirm={async () => {
          setPriorityPickerOpen(false);
          await applyPriorityFromPicker(priorityPickerDraft);
        }}
        onApply={(v) => applyPriorityFromPicker(v as TaskPriority)}
        variant={pickerVariant}
      />

      <TaskOptionPicker
        open={remindTimingPickerOpen}
        title="Когда напомнить"
        options={remindTimingSelectOptions}
        selected={remindTimingPickerDraft}
        onSelect={setRemindTimingPickerDraft}
        onClose={() => setRemindTimingPickerOpen(false)}
        onConfirm={() => {
          setRemindTimingPickerOpen(false);
          void applyReminderTimingFromPicker(remindTimingPickerDraft);
        }}
        onApply={(v) => applyReminderTimingFromPicker(v)}
        variant={pickerVariant}
      />
    </div>
  );
}

function Header({
  title,
  text,
  onBack,
  backDisabled = false,
}: {
  title: string;
  text: string;
  onBack?: () => void;
  backDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 mb-2">
      {onBack ? (
        <button type="button" onClick={onBack} disabled={backDisabled} className="inline-flex items-center min-h-11 text-[#E25B21] disabled:opacity-50">
          <ChevronLeft className="h-7 w-7" />
          <span className="text-base font-medium ml-0.5">Назад</span>
        </button>
      ) : (
        <div className="w-20" />
      )}
      <span className="text-lg font-semibold" style={{ color: text }}>
        {title}
      </span>
      <div className="w-20" />
    </div>
  );
}

function SectionLabel({
  children,
  text,
  desktop = false,
}: {
  children: React.ReactNode;
  text: string;
  desktop?: boolean;
}) {
  return (
    <p
      className={cn(
        "font-semibold px-1",
        desktop ? "text-sm text-[#8E8E93] mb-0.5" : "text-xs uppercase tracking-wide",
      )}
      style={desktop ? undefined : { color: text }}
    >
      {children}
    </p>
  );
}

function Card({
  children,
  border,
  cardBg,
  desktop = false,
}: {
  children: React.ReactNode;
  border: string;
  cardBg: string;
  desktop?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden",
        desktop && "border-[#3A3A3C] shadow-sm",
      )}
      style={{ backgroundColor: desktop ? "#2C2C2E" : cardBg, borderColor: border }}
    >
      {children}
    </div>
  );
}

function Divider({ border }: { border: string }) {
  return <div className="h-px mx-3" style={{ backgroundColor: border }} />;
}

function RowButton({
  icon,
  label,
  value,
  onClick,
  canEdit,
  text,
  textMuted,
  underline,
  desktop = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
  canEdit: boolean;
  text: string;
  textMuted: string;
  underline?: boolean;
  desktop?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 min-h-11 transition-colors",
        desktop && canEdit && "rounded-lg hover:bg-white/[0.04]",
      )}
      style={{ opacity: canEdit ? 1 : 0.55 }}
    >
      {icon}
      <span className="text-sm font-medium shrink-0" style={{ color: text }}>
        {label}
      </span>
      <span
        className="flex-1 text-sm text-right truncate"
        style={{
          color: textMuted,
          textDecoration: canEdit && underline ? "underline" : "none",
        }}
      >
        {value}
      </span>
      {canEdit ? <ChevronRight className="h-5 w-5 shrink-0" style={{ color: textMuted }} /> : null}
    </button>
  );
}

function RowStatic({
  icon,
  label,
  value,
  text,
  textMuted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  text: string;
  textMuted: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 min-h-11">
      {icon}
      <span className="text-sm font-medium" style={{ color: text }}>
        {label}
      </span>
      <span className="flex-1 text-sm text-right truncate" style={{ color: textMuted }}>
        {value}
      </span>
    </div>
  );
}
