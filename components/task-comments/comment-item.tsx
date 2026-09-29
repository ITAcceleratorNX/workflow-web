"use client";

import { memo } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  authorInitial,
  commentAccessibilityLabel,
  commentMeta,
  commentState,
  DELETED_COMMENT_TEXT,
  formatCommentMoment,
  mentionSegments,
} from "@/lib/task-comments/presentation";
import type { TaskCommentMention, TaskComment } from "@/lib/task-comments/types";

/** Цвета темы, общие для всех комментариев ленты. */
export interface CommentPalette {
  text: string;
  textMuted: string;
  primary: string;
  danger: string;
  card: string;
  border: string;
  ownCard: string;
}

/** Текст комментария: упоминания выделены цветом. */
export function MentionText({
  text,
  mentions,
  palette,
}: {
  text: string;
  mentions: readonly TaskCommentMention[];
  palette: CommentPalette;
}) {
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ color: palette.text }}>
      {mentionSegments(text, mentions).map((segment, index) =>
        segment.mention ? (
          <span key={index} className="font-semibold" style={{ color: palette.primary }}>
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

interface CommentItemProps {
  comment: TaskComment;
  /** Свой комментарий: выделяется фоном. */
  own: boolean;
  palette: CommentPalette;
  /** Идёт правка или удаление этого комментария. */
  changing?: "edit" | "delete" | null;
  /** Изменить свой комментарий; нет — нельзя. */
  onEdit?: (comment: TaskComment) => void;
  /** Удалить свой комментарий (после подтверждения); нет — нельзя. */
  onDelete?: (comment: TaskComment) => void;
}

/** Комментарий ленты задачи: автор, текст с упоминаниями, дата, время и метка «изменено». */
export const CommentItem = memo(function CommentItem({
  comment,
  own,
  palette,
  changing = null,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const moment = formatCommentMoment(comment.created_at);
  const { deleted } = commentState(comment);
  const meta = commentMeta(comment, moment, changing);
  const actionable = (onEdit !== undefined || onDelete !== undefined) && changing === null;

  return (
    <div className="group flex items-start gap-2.5" aria-label={commentAccessibilityLabel(comment, moment)}>
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
        style={{ backgroundColor: palette.card, color: palette.primary }}
      >
        {authorInitial(comment.author.full_name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate text-sm font-semibold" style={{ color: palette.text }}>
            {comment.author.full_name}
          </p>
          {actionable ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-md p-1 opacity-70 transition-opacity hover:bg-white/[0.06] hover:opacity-100"
                aria-label="Изменить или удалить комментарий"
              >
                <MoreHorizontal className="h-4 w-4" style={{ color: palette.textMuted }} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-[#3A3A3C] bg-[#1C1C1E] text-white">
                {onEdit ? (
                  <DropdownMenuItem onSelect={() => onEdit(comment)} className="gap-2 focus:bg-[#2C2C2E] focus:text-white">
                    <Pencil className="h-4 w-4" />
                    Изменить
                  </DropdownMenuItem>
                ) : null}
                {onDelete ? (
                  <DropdownMenuItem
                    onSelect={() => onDelete(comment)}
                    className="gap-2 text-red-400 focus:bg-[#2C2C2E] focus:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        {deleted ? (
          <div className="mt-1 inline-block rounded-xl border border-dashed px-3 py-2" style={{ borderColor: palette.border }}>
            <p className="text-sm italic" style={{ color: palette.textMuted }}>
              {DELETED_COMMENT_TEXT}
            </p>
          </div>
        ) : (
          <div
            className="mt-1 inline-block max-w-full rounded-xl border px-3 py-2"
            style={
              own
                ? { backgroundColor: palette.ownCard, borderColor: palette.ownCard }
                : { backgroundColor: palette.card, borderColor: palette.border }
            }
          >
            <MentionText text={comment.text ?? ""} mentions={comment.mentions} palette={palette} />
          </div>
        )}
        <p className="mt-1 text-xs" style={{ color: palette.textMuted }}>
          {meta}
        </p>
      </div>
    </div>
  );
});
