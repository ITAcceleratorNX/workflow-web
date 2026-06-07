"use client";

import { useEffect, useRef } from "react";
import { Check, CornerDownRight, LayoutGrid, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CatalogRowIcon = "category" | "subcategory";

const ICONS: Record<CatalogRowIcon, typeof LayoutGrid> = {
  category: LayoutGrid,
  subcategory: CornerDownRight,
};

export type EditableCatalogRowProps = {
  icon: CatalogRowIcon;
  iconBackgroundClassName?: string;
  iconClassName?: string;
  name: string;
  subtitle?: string;
  isEditing: boolean;
  draft: string;
  isSaving: boolean;
  onStartEdit: () => void;
  onChangeDraft: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

export function EditableCatalogRow({
  icon,
  iconBackgroundClassName = "bg-[rgba(243,87,19,0.2)]",
  iconClassName = "text-[#F35713]",
  name,
  subtitle,
  isEditing,
  draft,
  isSaving,
  onStartEdit,
  onChangeDraft,
  onSave,
  onCancel,
  onDelete,
}: EditableCatalogRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = ICONS[icon];
  const canSave = draft.trim().length > 0 && !isSaving;

  useEffect(() => {
    if (isEditing) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card p-3",
        isEditing ? "border-primary border-2" : "border-border",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          iconBackgroundClassName,
        )}
      >
        <Icon className={cn("h-5 w-5", iconClassName)} />
      </div>

      {isEditing ? (
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={draft}
            onChange={(e) => onChangeDraft(e.target.value)}
            placeholder="Название"
            disabled={isSaving}
            maxLength={255}
            aria-label="Новое название"
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave) onSave();
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-45"
              aria-label="Сохранить"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border disabled:opacity-45"
              aria-label="Отмена"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onStartEdit}
            className="min-w-0 flex-1 space-y-0.5 py-0.5 text-left active:opacity-75"
            aria-label={`Изменить название: ${name}`}
          >
            <p className="line-clamp-3 text-sm font-semibold text-foreground">{name}</p>
            {subtitle ? (
              <p className="line-clamp-1 text-xs text-[#F35713]">{subtitle}</p>
            ) : null}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border active:opacity-70"
            aria-label="Удалить"
          >
            <Trash2 className="h-5 w-5 text-destructive" />
          </button>
        </>
      )}
    </div>
  );
}
