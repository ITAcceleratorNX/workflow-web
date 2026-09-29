"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronUp, Loader2, RefreshCw } from "lucide-react";

import { useTaskComments } from "@/hooks/use-task-comments";
import { useToast } from "@/hooks/use-toast";
import type { TaskCommentFailureKind } from "@/lib/task-comments/errors";
import { withoutRejectedMentions } from "@/lib/task-comments/composer";
import { authorInitial, failureText, ownCommentActions } from "@/lib/task-comments/presentation";
import type { PendingComment } from "@/lib/task-comments/store";
import type { TaskComment } from "@/lib/task-comments/types";
import { confirmAction } from "@/stores/confirm-dialog-store";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import { CommentComposer, type CommentComposerHandle } from "./comment-composer";
import { CommentItem, MentionText, type CommentPalette } from "./comment-item";

type Comments = ReturnType<typeof useTaskComments>;

/** Повтор поможет, только если сервер не ответил или не справился; отклонённое содержимое надо исправить. */
const RETRYABLE: ReadonlySet<TaskCommentFailureKind> = new Set(["offline", "server", "rate_limited", "cancelled"]);

type Props = {
  taskId: number;
  colors: { text: string; textMuted: string; primary: string; cardBg: string; border: string };
  desktop?: boolean;
};

/**
 * Блок «Комментарии» карточки задачи (порт мобильного TaskCommentsList): лента с догрузкой истории,
 * свои неотправленные сообщения, поле ввода с @упоминаниями; свои комментарии меняются и удаляются
 * через меню «…». Права приходят с сервера: у читателя переданной задачи поле ввода закрыто.
 */
export function TaskCommentsSection({ taskId, colors, desktop = false }: Props) {
  const comments = useTaskComments(taskId);
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const currentUserName = useAuthStore((state) => state.user?.full_name ?? "");
  const { toast } = useToast();
  const [editing, setEditing] = useState<TaskComment | null>(null);
  const composerRef = useRef<CommentComposerHandle>(null);

  const palette = useMemo<CommentPalette>(
    () => ({
      text: colors.text,
      textMuted: colors.textMuted,
      primary: colors.primary,
      danger: "#EF4444",
      card: desktop ? "#1C1C1E" : colors.cardBg,
      border: colors.border,
      ownCard: `${colors.primary}26`,
    }),
    [colors, desktop],
  );

  const { changing, remove, retry, discard, peekDraft, setDraft } = comments;

  const deleteComment = useCallback(
    async (comment: TaskComment) => {
      const sure = await confirmAction({
        title: "Удалить комментарий?",
        message: "В ленте на его месте останется строка «Комментарий удалён».",
        confirmLabel: "Удалить",
        destructive: true,
      });
      if (!sure) return;
      setEditing((current) => (current?.id === comment.id ? null : current));
      const outcome = await remove(comment.id);
      if (outcome.ok || outcome.failure.kind === "cancelled") return;
      toast({ title: "Не удалось удалить комментарий", description: outcome.failure.message, variant: "destructive", duration: 4000 });
    },
    [remove, toast],
  );

  const discardPending = useCallback(
    async (entry: PendingComment) => {
      const sure = await confirmAction({
        title: "Удалить неотправленное сообщение?",
        message: "Его текст не сохранится.",
        confirmLabel: "Удалить",
        destructive: true,
      });
      if (sure) discard(entry.localId);
    },
    [discard],
  );

  /** Неотправленное — обратно в поле ввода: отклонённые упоминания становятся обычным текстом. */
  const editPending = useCallback(
    (entry: PendingComment) => {
      if (peekDraft().text !== "") {
        toast({
          title: "Поле ввода занято",
          description: "Отправьте или сотрите набранный текст, чтобы исправить неотправленное сообщение.",
          duration: 4000,
        });
        return;
      }
      const draft = discard(entry.localId);
      if (!draft) return;
      setEditing(null);
      setDraft(entry.failure ? withoutRejectedMentions(draft, entry.failure) : draft);
      composerRef.current?.focus();
    },
    [discard, peekDraft, setDraft, toast],
  );

  if (comments.status === "disabled") return null;
  const ready = comments.status === "ready";
  const writable = ready && comments.canComment;

  return (
    <>
      <div className="flex items-center gap-2 px-1">
        <p
          className={cn("flex-1 font-semibold", desktop ? "text-sm text-[#8E8E93]" : "text-xs uppercase tracking-wide")}
          style={desktop ? undefined : { color: colors.textMuted }}
        >
          Комментарии
        </p>
        {ready ? (
          comments.refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: colors.textMuted }} />
          ) : (
            <button type="button" onClick={() => void comments.refresh()} aria-label="Обновить комментарии">
              <RefreshCw className="h-4 w-4" style={{ color: colors.textMuted }} />
            </button>
          )
        ) : null}
      </div>

      <div
        className={cn("space-y-4 rounded-2xl border p-3", desktop && "border-[#3A3A3C] shadow-sm lg:p-4")}
        style={{ backgroundColor: desktop ? "#2C2C2E" : colors.cardBg, borderColor: colors.border }}
      >
        {ready && comments.readError ? (
          <button
            type="button"
            onClick={() => void comments.refresh()}
            className="flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left"
            style={{ borderColor: colors.border }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" style={{ color: colors.textMuted }} />
            <span className="flex-1 text-xs" style={{ color: colors.textMuted }}>
              {comments.readError.message}
            </span>
            <span className="text-xs font-semibold" style={{ color: colors.primary }}>
              Повторить
            </span>
          </button>
        ) : null}

        {ready && comments.hasOlder ? (
          comments.historyLimited ? (
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Более ранние комментарии не показываются: переписка слишком длинная
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void comments.loadOlder()}
              disabled={comments.loadingOlder}
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: colors.primary }}
            >
              {comments.loadingOlder ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronUp className="h-4 w-4" />}
              Показать более ранние
            </button>
          )
        ) : null}

        {comments.items.map((item) => {
          const actions = ownCommentActions(item, currentUserId);
          return (
            <CommentItem
              key={item.id}
              comment={item}
              own={currentUserId !== null && item.author.id === currentUserId}
              palette={palette}
              changing={changing[item.id] ?? null}
              onEdit={actions.edit ? setEditing : undefined}
              onDelete={actions.remove ? (c) => void deleteComment(c) : undefined}
            />
          );
        })}

        {comments.pending.map((entry) => (
          <PendingItem
            key={entry.localId}
            entry={entry}
            authorName={currentUserName}
            writable={writable}
            palette={palette}
            onRetry={() => void retry(entry.localId)}
            onEdit={() => editPending(entry)}
            onDiscard={() => void discardPending(entry)}
          />
        ))}

        <FeedState comments={comments} palette={palette} />

        <CommentComposer
          key={editing ? `edit-${editing.id}` : "new"}
          taskId={taskId}
          comments={comments}
          editing={editing}
          onStopEditing={() => setEditing(null)}
          palette={palette}
          ref={composerRef}
        />
      </div>
    </>
  );
}

function PendingItem({
  entry,
  authorName,
  writable,
  palette,
  onRetry,
  onEdit,
  onDiscard,
}: {
  entry: PendingComment;
  authorName: string;
  writable: boolean;
  palette: CommentPalette;
  onRetry: () => void;
  onEdit: () => void;
  onDiscard: () => void;
}) {
  const sending = entry.status === "sending";
  const { text, mentions } = entry.draft;
  const labelled = mentions.map((mention) => ({ ...mention, label: text.slice(mention.start + 1, mention.end) }));
  const canRetry = writable && entry.failure !== null && RETRYABLE.has(entry.failure.kind);

  return (
    <div className="flex items-start gap-2.5">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
        style={{ backgroundColor: palette.card, color: palette.primary }}
      >
        {authorInitial(authorName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: palette.text }}>
          {authorName}
        </p>
        <div
          className={cn("mt-1 inline-block max-w-full rounded-xl border px-3 py-2", sending && "opacity-60")}
          style={{ backgroundColor: palette.ownCard, borderColor: sending ? palette.ownCard : palette.danger }}
        >
          <MentionText text={text} mentions={labelled} palette={palette} />
        </div>
        {sending ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: palette.textMuted }}>
            <Loader2 className="h-3 w-3 animate-spin" />
            Отправляется…
          </p>
        ) : (
          <div className="mt-1 space-y-1">
            <p className="text-xs" style={{ color: palette.danger }}>
              Не отправлено: {entry.failure ? failureText(entry.failure) : ""}
            </p>
            <div className="flex gap-4 text-xs font-semibold">
              {canRetry ? (
                <button type="button" style={{ color: palette.primary }} onClick={onRetry}>
                  Повторить
                </button>
              ) : null}
              {writable ? (
                <button type="button" style={{ color: palette.primary }} onClick={onEdit}>
                  Изменить
                </button>
              ) : null}
              <button type="button" style={{ color: palette.danger }} onClick={onDiscard}>
                Удалить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedState({ comments, palette }: { comments: Comments; palette: CommentPalette }) {
  const note = (children: string) => (
    <p className="text-center text-sm" style={{ color: palette.textMuted }}>
      {children}
    </p>
  );
  switch (comments.status) {
    case "idle":
    case "loading":
      return (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: palette.primary }} />
          <span className="text-sm" style={{ color: palette.textMuted }}>
            Загружаем комментарии…
          </span>
        </div>
      );
    case "failed": {
      const failure = comments.readError;
      const retryable = failure !== null && failure.kind !== "unsupported" && failure.kind !== "forbidden";
      return (
        <div className="flex flex-col items-center gap-1 py-2">
          {note(failure?.message || "Не удалось загрузить комментарии")}
          {retryable ? (
            <button type="button" className="text-sm font-semibold" style={{ color: palette.primary }} onClick={() => void comments.refresh()}>
              Повторить
            </button>
          ) : null}
        </div>
      );
    }
    case "unavailable":
      return note("Комментарии недоступны: задачи нет или у вас больше нет к ней доступа");
    case "ready":
      return comments.items.length === 0 && comments.pending.length === 0 ? note("Комментариев пока нет") : null;
    default:
      return null;
  }
}
