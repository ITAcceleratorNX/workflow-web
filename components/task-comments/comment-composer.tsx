"use client";

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { Check, Loader2, Lock, Pencil, Send, X } from "lucide-react";

import { useCommentDraft, type useTaskComments } from "@/hooks/use-task-comments";
import { useToast } from "@/hooks/use-toast";
import {
  applyTextChange,
  asNewMessage,
  checkDraft,
  COUNTER_FROM,
  draftFromComment,
  EMPTY_DRAFT,
  insertMention,
  MAX_MENTIONS,
  MAX_TEXT_CODE_POINTS,
  mentionQueryAt,
  withoutRejectedMentions,
} from "@/lib/task-comments/composer";
import type { TaskCommentFailure } from "@/lib/task-comments/errors";
import { failureText } from "@/lib/task-comments/presentation";
import type { CommentDraft, MentionCandidate, TaskComment } from "@/lib/task-comments/types";
import type { CommentPalette } from "./comment-item";
import { MentionPicker } from "./mention-picker";

type Comments = ReturnType<typeof useTaskComments>;

export interface CommentComposerHandle {
  focus(): void;
}

interface CommentComposerProps {
  taskId: number;
  comments: Comments;
  /** Свой комментарий, который правится; null — новое сообщение. */
  editing: TaskComment | null;
  onStopEditing: () => void;
  palette: CommentPalette;
  ref?: Ref<CommentComposerHandle>;
}

const formatCount = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function editNotice(failure: TaskCommentFailure): string {
  if (failure.code === "COMMENT_VERSION_CONFLICT") {
    return "Комментарий изменили на другом устройстве, лента обновлена. Ваш текст сохранён: нажмите «Сохранить», чтобы заменить.";
  }
  return failureText(failure);
}

/**
 * Поле ввода под лентой: новое сообщение или правка своего комментария, упоминания через @.
 * Ctrl/⌘+Enter отправляет. Новое сообщение хранится черновиком задачи и уходит в ленту сразу.
 * Если писать больше нельзя, недописанный текст остаётся видимым, пока его не очистят.
 */
export function CommentComposer({ taskId, comments, editing, onStopEditing, palette, ref }: CommentComposerProps) {
  const [newDraft, setNewDraft] = useCommentDraft(taskId);
  const [editDraft, setEditDraft] = useState<CommentDraft | null>(() => (editing ? draftFromComment(editing) : null));
  const [caret, setCaret] = useState(0);
  const [pendingCaret, setPendingCaret] = useState<number | null>(null);
  /** Где стоит @, для которого список закрыли вручную. */
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  const { refresh } = comments;
  const editingMode = editing !== null && editDraft !== null;
  const draft = editDraft ?? newDraft;
  const update = (next: CommentDraft) => (editDraft !== null ? setEditDraft(next) : setNewDraft(next));
  const check = checkDraft(draft);
  const writable = comments.status === "ready" && comments.canComment;
  const query = writable ? mentionQueryAt(draft, caret) : null;
  const activeQuery = query !== null && query.start !== dismissedAt ? query : null;

  // Высота поля — по содержимому, до разумного предела.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft.text]);

  useEffect(() => {
    if (pendingCaret === null) return;
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(pendingCaret, pendingCaret);
    }
    setPendingCaret(null);
  }, [pendingCaret]);

  useEffect(() => {
    if (editingMode) inputRef.current?.focus();
  }, [editingMode]);

  const onChange = (el: HTMLTextAreaElement) => {
    update(applyTextChange(draft, el.value));
    setCaret(el.selectionStart ?? el.value.length);
    if (notice !== null && !saving) setNotice(null);
  };

  const onPick = (person: MentionCandidate) => {
    if (!activeQuery) return;
    const { draft: next, cursor } = insertMention(draft, activeQuery, person);
    update(next);
    setCaret(cursor);
    setPendingCaret(cursor);
  };

  const send = () => {
    if (!writable || !check.canSend) return;
    const outgoing = draft;
    setNewDraft(EMPTY_DRAFT);
    setDismissedAt(null);
    void comments.send(outgoing);
  };

  const save = async () => {
    if (!editing || editDraft === null || saving || !writable || !check.canSend) return;
    setSaving(true);
    setNotice(null);
    const outcome = await comments.edit(editing.id, editDraft);
    setSaving(false);
    if (outcome.ok) {
      onStopEditing();
      return;
    }
    const { failure } = outcome;
    if (failure.kind === "cancelled") return;
    if (failure.code === "COMMENT_DELETED" || failure.code === "COMMENT_NOT_FOUND") {
      if (comments.peekDraft().text === "") {
        comments.setDraft(asNewMessage(editDraft));
        toast({
          title: "Комментарий уже удалён",
          description: "Текст правки оставлен в поле ввода: его можно отправить новым сообщением.",
          duration: 4000,
        });
        onStopEditing();
        return;
      }
      setNotice("Комментарий уже удалён, сохранить правку нельзя. Скопируйте текст, если он нужен, и отмените редактирование.");
      return;
    }
    if (failure.kind === "rejected") setEditDraft(withoutRejectedMentions(editDraft, failure));
    setNotice(editNotice(failure));
  };

  const barStyle = { borderColor: palette.border };

  if (!writable) {
    if (comments.status !== "ready" && comments.status !== "unavailable") return null;
    if (check.blank) {
      return comments.status === "ready" ? (
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5" style={barStyle}>
          <Lock className="h-4 w-4 shrink-0" style={{ color: palette.textMuted }} />
          <p className="text-xs" style={{ color: palette.textMuted }}>
            Задача доступна вам только для чтения: комментарии можно читать, но не писать
          </p>
        </div>
      ) : null;
    }
    return (
      <div className="space-y-2 rounded-xl border px-3 py-2.5" style={barStyle}>
        <p className="text-xs" style={{ color: palette.danger }}>
          {comments.status === "unavailable"
            ? "Не отправлено: задача больше недоступна"
            : "Не отправлено: задача стала доступна вам только для чтения"}
        </p>
        <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm select-text" style={{ color: palette.text }}>
          {draft.text}
        </p>
        <button
          type="button"
          className="text-xs font-semibold"
          style={{ color: palette.primary }}
          onClick={() => (editingMode ? onStopEditing() : setNewDraft(EMPTY_DRAFT))}
        >
          Очистить
        </button>
      </div>
    );
  }

  const disabled = !check.canSend || saving;

  return (
    <div className="space-y-2">
      {editingMode ? (
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4" style={{ color: palette.primary }} />
          <span className="flex-1 text-xs font-semibold" style={{ color: palette.primary }}>
            Редактирование комментария
          </span>
          <button type="button" onClick={onStopEditing} aria-label="Отменить редактирование">
            <X className="h-4 w-4" style={{ color: palette.textMuted }} />
          </button>
        </div>
      ) : null}
      {notice ? (
        <p className="text-xs" style={{ color: palette.danger }}>
          {notice}
        </p>
      ) : null}
      {activeQuery ? (
        <MentionPicker
          taskId={taskId}
          query={activeQuery.query}
          full={draft.mentions.length >= MAX_MENTIONS}
          onPick={onPick}
          onClose={() => setDismissedAt(activeQuery.start)}
          onReadOnly={() => void refresh()}
          palette={palette}
        />
      ) : null}
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={draft.text}
          rows={1}
          onChange={(e) => onChange(e.target)}
          onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && activeQuery) {
              e.preventDefault();
              setDismissedAt(activeQuery.start);
              return;
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              if (editingMode) void save();
              else send();
            }
          }}
          placeholder={editingMode ? "Текст комментария" : "Комментарий, @ — упомянуть"}
          aria-label={editingMode ? "Текст комментария" : "Новый комментарий"}
          className="min-h-[44px] flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#E25B21]"
          style={{ color: palette.text, backgroundColor: palette.card, borderColor: palette.border }}
        />
        <button
          type="button"
          onClick={editingMode ? () => void save() : send}
          disabled={disabled}
          aria-label={editingMode ? "Сохранить изменения" : "Отправить комментарий"}
          title={editingMode ? "Сохранить (Ctrl/⌘+Enter)" : "Отправить (Ctrl/⌘+Enter)"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-opacity disabled:opacity-45"
          style={{ backgroundColor: palette.primary }}
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : editingMode ? (
            <Check className="h-5 w-5" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
      {check.length >= COUNTER_FROM || check.tooManyMentions ? (
        <p className="text-right text-xs" style={{ color: check.tooLong || check.tooManyMentions ? palette.danger : palette.textMuted }}>
          {check.tooManyMentions
            ? `Упоминаний больше ${MAX_MENTIONS}: уберите лишние`
            : `${formatCount(check.length)} / ${formatCount(MAX_TEXT_CODE_POINTS)}`}
        </p>
      ) : null}
    </div>
  );
}
