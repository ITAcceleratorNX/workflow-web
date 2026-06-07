"use client";

import {
  useCallback,
  useEffect,
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
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  TaskExecutorPickerOverlay,
  TaskTeamPickerOverlay,
} from "@/components/tasks/task-assignment-pickers";
import { TaskScheduleSheet } from "@/components/tasks/task-schedule-sheet";
import { useToast } from "@/hooks/use-toast";
import { useTeams } from "@/hooks/use-teams";
import { useTodoList } from "@/hooks/use-todo-list";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  formatRequestDate,
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
  uploadUserTaskAttachments,
  type TaskPriority,
  type UserTask,
  type UserTaskAttachment,
} from "@/lib/user-tasks-api";
import type { Team } from "@/lib/teams-api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserTasksInvalidateStore } from "@/stores/user-tasks-invalidate-store";

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

type ClientTaskDetailMobileViewProps = {
  taskId: number;
};

export function ClientTaskDetailMobileView({ taskId }: ClientTaskDetailMobileViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const isGuest = useAuthStore((s) => s.isGuest);
  const { teams, loading: teamsLoading } = useTeams();
  const tasksInvalidateVersion = useUserTasksInvalidateStore((s) => s.version);

  const background = useThemeColor("background");
  const text = useThemeColor("text");
  const textMuted = useThemeColor("textMuted");
  const primary = useThemeColor("primary");
  const cardBg = useThemeColor("cardBackground");
  const border = useThemeColor("border");

  const { tasks, updateTask, removeTask, toggleComplete } = useTodoList({
    filter: "all",
    enabled: false,
  });

  const [fetchedTask, setFetchedTask] = useState<UserTask | null>(null);
  const [loadingTask, setLoadingTask] = useState(false);

  const task = useMemo(() => {
    return tasks.find((t) => t.id === taskId) ?? fetchedTask;
  }, [tasks, taskId, fetchedTask]);

  useEffect(() => {
    if (isGuest) {
      setFetchedTask(null);
      setLoadingTask(false);
      return;
    }
    if (tasks.some((t) => t.id === taskId)) {
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
        router.back();
      }
      setLoadingTask(false);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId, isGuest, tasks, tasksInvalidateVersion, router, toast]);

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
  const taskRef = useRef(task);
  const canEditDetailsRef = useRef(canEditDetails);
  const titleDraftRef = useRef(titleDraft);
  const completeToggleBusyRef = useRef(false);
  taskRef.current = task;
  canEditDetailsRef.current = canEditDetails;
  titleDraftRef.current = titleDraft;
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const [pickerSheet, setPickerSheet] = useState<"team" | "executor" | null>(null);
  const [executorDraft, setExecutorDraft] = useState<{ id: number; full_name: string } | null>(null);

  const [attachments, setAttachments] = useState<UserTaskAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!task) return;
    setTitleDraft(task.title ?? "");
  }, [task?.id, task?.title]);

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
    const t = taskRef.current;
    if (!t || !canEditDetailsRef.current) return;
    const next = titleDraftRef.current.trim();
    if (!next) {
      setTitleDraft(t.title ?? "");
      return;
    }
    if (next === t.title) return;
    await updateTask(t, { title: next });
  }, [updateTask]);

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

  const applyExecutor = useCallback(
    async (next: { id: number; full_name: string } | null) => {
      if (!task || !canEditDetails) return;
      await updateTask(task, {
        team_id: null,
        executor_id: next?.id ?? null,
        assignee_ids: next ? [next.id] : [],
        assignees: next ? [next] : [],
        executor: next ?? undefined,
      });
    },
    [task, canEditDetails, updateTask],
  );

  const handleExecutorSelect = useCallback(
    (user: { id: number; full_name: string } | null) => {
      setExecutorDraft(user);
      setPickerSheet(null);
      if (!task || !canEditDetails) return;
      const current = getExecutorFromTask(task);
      if ((current?.id ?? null) === (user?.id ?? null)) return;
      void applyExecutor(user);
    },
    [task, canEditDetails, applyExecutor],
  );

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

  const todayKey = toAppDateKey(new Date());
  const tomorrowKey = toAppDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000));

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

  const resolvedTeam = useMemo((): Team | null => {
    if (!task?.team_id) return null;
    const fromList = teams.find((t) => t.id === task.team_id);
    if (fromList) return fromList;
    if (task.team) {
      return {
        id: task.team.id,
        name: task.team.name,
        leader_id: task.team.leader_id,
        created_by: task.creator_id,
        created_at: task.created_at,
        updated_at: task.updated_at,
        leader: task.team.leader,
        members: task.team.members,
      };
    }
    return null;
  }, [task, teams]);

  if (!task) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: background }}>
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <Header title="Подробно" text={text} />
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
    <div className="min-h-screen pb-8" style={{ backgroundColor: background }}>
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full" style={{ backgroundColor: primary }} />
      </div>
      <Header title="Подробно" text={text} onBack={() => router.back()} />

      <div className="px-4 space-y-4">
        <div
          className="rounded-2xl border p-4"
          style={{ backgroundColor: cardBg, borderColor: border }}
        >
          <textarea
            value={titleDraft}
            onChange={(e) => {
              setTitleDraft(e.target.value);
              scheduleTitleSave();
            }}
            onBlur={() => void flushTitleToServer()}
            onClick={() => {
              if (!canEditDetails) notifyCreatorOnly();
            }}
            readOnly={!canEditDetails}
            rows={3}
            placeholder="Название и описание"
            className="w-full bg-transparent text-lg font-medium outline-none resize-none min-h-[4rem]"
            style={{ color: canEditDetails ? text : textMuted }}
          />
        </div>

        <SectionLabel text={textMuted}>Вложения</SectionLabel>
        <Card border={border} cardBg={cardBg}>
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

        <SectionLabel text={textMuted}>Срок</SectionLabel>
        <Card border={border} cardBg={cardBg}>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (!canEditDetails) notifyCreatorOnly();
                else openScheduleModal();
              }}
              className="flex-1 flex items-center gap-3 p-3 min-h-11 text-left"
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

        {!isGuest ? (
          <>
            <SectionLabel text={textMuted}>Организация</SectionLabel>
            <Card border={border} cardBg={cardBg}>
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
              />
              <Divider border={border} />
              <RowButton
                icon={<User className="h-5 w-5" style={{ color: textMuted }} />}
                label="Исполнитель"
                value={executorRowSummary}
                onClick={() => {
                  if (!canEditDetails) notifyCreatorOnly();
                  else {
                    const initial = getExecutorFromTask(task);
                    setExecutorDraft(initial);
                    setPickerSheet("executor");
                  }
                }}
                canEdit={canEditDetails}
                text={text}
                textMuted={textMuted}
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

        <SectionLabel text={textMuted}>Приоритет</SectionLabel>
        <Card border={border} cardBg={cardBg}>
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
          />
        </Card>

        <SectionLabel text={textMuted}>Напоминания</SectionLabel>
        <Card border={border} cardBg={cardBg}>
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
          />
          <div className="px-3 py-2 border-t" style={{ borderColor: border }}>
            <p className="text-xs" style={{ color: textMuted }}>
              {task.scheduled_at
                ? `Напоминание «за N минут» считается от времени срока: ${scheduledPrimaryLine}`
                : "Без срока в календаре используется системная логика напоминаний."}
            </p>
          </div>
        </Card>

        <Card border={border} cardBg={cardBg}>
          <div className="flex items-center p-3">
            <div className="flex items-center gap-3 flex-1">
              <Check className="h-5 w-5" style={{ color: textMuted }} />
              <span className="text-sm font-medium" style={{ color: text }}>
                Выполнено
              </span>
            </div>
            <Switch checked={task.completed} onCheckedChange={() => void handleCompleteSwitch()} />
          </div>
          <Divider border={border} />
          <button
            type="button"
            disabled={!canEditDetails}
            onClick={async () => {
              if (!canEditDetails) return;
              await removeTask(task);
              router.back();
            }}
            className="w-full flex items-center gap-3 p-3 min-h-11"
            style={{ opacity: canEditDetails ? 1 : 0.45 }}
          >
            <Trash2 className="h-5 w-5 text-red-400" />
            <span className="text-sm font-medium text-red-400">Удалить задачу</span>
          </button>
        </Card>
      </div>

      <TaskScheduleSheet
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onConfirm={() => void applyScheduleModal()}
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
      />

      <TaskExecutorPickerOverlay
        visible={pickerSheet === "executor"}
        onClose={() => setPickerSheet(null)}
        teamScope={!!task.team_id}
        team={resolvedTeam}
        teamLoading={teamsLoading}
        selectedExecutor={executorDraft}
        onSelect={handleExecutorSelect}
      />

      <OptionPickerSheet
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
      />

      <OptionPickerSheet
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
      />
    </div>
  );
}

function Header({
  title,
  text,
  onBack,
}: {
  title: string;
  text: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 mb-2">
      {onBack ? (
        <button type="button" onClick={onBack} className="inline-flex items-center min-h-11 text-[#E25B21]">
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

function SectionLabel({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide px-1" style={{ color: text }}>
      {children}
    </p>
  );
}

function Card({
  children,
  border,
  cardBg,
}: {
  children: React.ReactNode;
  border: string;
  cardBg: string;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: border }}>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
  canEdit: boolean;
  text: string;
  textMuted: string;
  underline?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 min-h-11"
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

function OptionPickerSheet({
  open,
  title,
  options,
  selected,
  onSelect,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const background = useThemeColor("background");
  const text = useThemeColor("text");
  const primary = useThemeColor("primary");
  const border = useThemeColor("border");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Закрыть" />
      <div className="relative rounded-t-2xl max-h-[70vh] flex flex-col" style={{ backgroundColor: background }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: border }}>
          <button type="button" onClick={onClose} className="p-2 min-h-11">
            <ChevronLeft className="h-6 w-6" style={{ color: text }} />
          </button>
          <span className="text-lg font-semibold" style={{ color: text }}>
            {title}
          </span>
          <button type="button" onClick={onConfirm} className="p-2 min-h-11">
            <Check className="h-6 w-6" style={{ color: primary }} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-8">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className="w-full flex items-center justify-between py-3 border-b min-h-11"
              style={{ borderColor: border }}
            >
              <span style={{ color: text }}>{opt.label}</span>
              {selected === opt.value ? <Check className="h-5 w-5" style={{ color: primary }} /> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
