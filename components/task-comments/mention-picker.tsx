"use client";

import { useEffect, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";

import { useMentionSearch } from "@/hooks/use-mention-search";
import { MAX_MENTIONS } from "@/lib/task-comments/composer";
import { authorInitial } from "@/lib/task-comments/presentation";
import type { MentionCandidate } from "@/lib/task-comments/types";
import type { CommentPalette } from "./comment-item";

interface MentionPickerProps {
  taskId: number;
  /** Что набрано после @. */
  query: string;
  /** Упоминаний уже столько, сколько принимает сервер. */
  full: boolean;
  onPick: (person: MentionCandidate) => void;
  onClose: () => void;
  /** Сервер ответил, что писать в задачу больше нельзя. */
  onReadOnly: () => void;
  palette: CommentPalette;
}

/**
 * Кого можно упомянуть: только тех, кого предлагает сервер, — текущих участников задачи, кроме
 * самого пишущего. Поиск по ФИО и должности идёт после паузы в наборе.
 */
export function MentionPicker({ taskId, query, full, onPick, onClose, onReadOnly, palette }: MentionPickerProps) {
  const { state, search } = useMentionSearch(taskId);

  useEffect(() => {
    if (!full) search.search(query);
  }, [search, query, full]);

  const readOnly = state.failure?.kind === "read_only";
  useEffect(() => {
    if (readOnly) onReadOnly();
  }, [readOnly, onReadOnly]);

  const note = (children: ReactNode) => (
    <p className="px-3 py-2.5 text-xs" style={{ color: palette.textMuted }}>
      {children}
    </p>
  );

  let body: ReactNode;
  if (full) {
    body = note(`Больше ${MAX_MENTIONS} упоминаний в одном комментарии нельзя`);
  } else if (state.failure) {
    body = (
      <div className="flex items-center gap-3 px-3 py-2.5">
        <p className="flex-1 text-xs" style={{ color: palette.textMuted }}>
          {state.failure.message}
        </p>
        {readOnly ? null : (
          <button type="button" className="text-xs font-semibold" style={{ color: palette.primary }} onClick={() => search.search(query)}>
            Повторить
          </button>
        )}
      </div>
    );
  } else if (!state.loading && state.items.length === 0) {
    body = note("Никого не найдено. Упомянуть можно только участников задачи");
  } else {
    body = (
      <div
        className="max-h-56 overflow-y-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) search.loadMore();
        }}
      >
        {state.items.map((item) => (
          <button
            key={item.id}
            type="button"
            // mousedown, не click: иначе поле ввода теряет фокус и позицию курсора раньше выбора.
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(item);
            }}
            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/[0.06]"
            aria-label={`Упомянуть: ${item.full_name}${item.position ? `, ${item.position}` : ""}`}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: palette.ownCard, color: palette.primary }}
            >
              {authorInitial(item.full_name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm" style={{ color: palette.text }}>
                {item.full_name}
              </span>
              {item.position ? (
                <span className="block truncate text-xs" style={{ color: palette.textMuted }}>
                  {item.position}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border" style={{ backgroundColor: palette.card, borderColor: palette.border }}>
      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
        <span className="flex-1 text-xs font-bold" style={{ color: palette.textMuted }}>
          Упомянуть участника
        </span>
        {state.loading ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: palette.textMuted }} /> : null}
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClose} aria-label="Закрыть список участников">
          <X className="h-4 w-4" style={{ color: palette.textMuted }} />
        </button>
      </div>
      {body}
    </div>
  );
}
