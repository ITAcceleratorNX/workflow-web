"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type InlineEditTextProps = {
  value: string;
  /** Saves the trimmed text; false keeps the editor open (the caller has shown why). */
  onSave: (next: string) => Promise<boolean>;
  editable: boolean;
  /** Accessible name of the field («Название задачи»). */
  label: string;
  /** Enter adds a line instead of saving. */
  multiline?: boolean;
  /** Required text: an empty value is refused with this message. */
  requiredMessage?: string;
  maxLength?: number;
  placeholder?: string;
  /** Shown instead of an empty value when the text can be edited («Добавить описание»). */
  emptyLabel?: ReactNode;
  className?: string;
};

/**
 * Text that turns into a field on click (title and description of a task card). Enter or leaving
 * the field saves, Esc cancels; a refused save keeps the field open with the typed text.
 */
export function InlineEditText({
  value,
  onSave,
  editable,
  label,
  multiline = false,
  requiredMessage,
  maxLength,
  placeholder,
  emptyLabel,
  className,
}: InlineEditTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useLayoutEffect(() => {
    const field = ref.current;
    if (!editing || !field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }, [editing, draft]);

  useEffect(() => {
    if (!editing) return;
    const field = ref.current;
    field?.focus();
    field?.setSelectionRange(field.value.length, field.value.length);
  }, [editing]);

  const commit = async () => {
    if (saving) return;
    const next = draft.trim();
    if (next === value.trim()) {
      setEditing(false);
      setError(null);
      return;
    }
    if (!next && requiredMessage) {
      setError(requiredMessage);
      return;
    }
    setSaving(true);
    const ok = await onSave(next);
    setSaving(false);
    if (ok) {
      setEditing(false);
      setError(null);
    }
  };

  if (!editing) {
    const text = value.trim();
    if (!text && !editable) return null;
    if (!editable) return <p className={cn("whitespace-pre-wrap break-words", className)}>{text}</p>;
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`${label}: ${text || "пусто"}. Изменить`}
        className={cn(
          "-mx-1.5 -my-1 w-[calc(100%+0.75rem)] whitespace-pre-wrap break-words rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-ui-fg/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
          !text && "text-ui-fg/40",
          className,
        )}
      >
        {text || emptyLabel || placeholder}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={ref}
        value={draft}
        rows={1}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={saving}
        onChange={(event) => {
          setDraft(event.target.value);
          if (error) setError(null);
        }}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setDraft(value);
            setError(null);
            setEditing(false);
          } else if (event.key === "Enter" && !event.shiftKey && !multiline) {
            event.preventDefault();
            void commit();
          }
        }}
        className={cn(
          "-mx-1.5 -my-1 w-[calc(100%+0.75rem)] resize-none overflow-hidden rounded-lg bg-ui-fg/[0.05] px-1.5 py-1 text-ui-fg outline-none ring-1 ring-ui-accent placeholder:text-ui-fg/40 disabled:opacity-60",
          className,
        )}
      />
      {error ? (
        <p role="alert" className="text-[13px] text-ui-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
