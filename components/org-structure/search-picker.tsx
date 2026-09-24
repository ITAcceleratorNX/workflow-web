"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchPickerProps<T> = {
  /** Загрузка вариантов по строке поиска (API или локальный фильтр). */
  load: (query: string) => Promise<T[]>;
  getKey: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
  onSelect: (item: T) => void;
  isItemDisabled?: (item: T) => boolean;
  placeholder?: string;
  /** Минимум символов до запроса; 0 — показывать варианты сразу. */
  minChars?: number;
  emptyText?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  /** Сбрасывать ввод после выбора. */
  clearOnSelect?: boolean;
  /** Смена значения перезапускает поиск (например, когда локальный список догрузился). */
  refreshKey?: unknown;
};

/**
 * Поиск с вводом с клавиатуры вместо длинного выпадающего списка.
 * Результаты — встроенным списком под полем (без порталов, корректно работает внутри модалок).
 */
export function SearchPicker<T>({
  load,
  getKey,
  renderItem,
  onSelect,
  isItemDisabled,
  placeholder = "Начните вводить…",
  minChars = 1,
  emptyText = "Ничего не найдено",
  disabled,
  autoFocus,
  className,
  clearOnSelect = true,
  refreshKey,
}: SearchPickerProps<T>) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(minChars === 0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const trimmed = query.trim();
  const active = trimmed.length >= minChars;

  useEffect(() => {
    if (!active) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(
      () => {
        void loadRef.current(trimmed).then((res) => {
          if (cancelled) return;
          setItems(res);
          setLoading(false);
        });
      },
      minChars === 0 && !trimmed ? 0 : 250,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmed, active, minChars, refreshKey]);

  const showList = touched && active && !disabled;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setTouched(true);
          }}
          onFocus={() => setTouched(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="pl-9 pr-9"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Очистить"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {showList ? (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-card">
          {!loading && items.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            items.map((item) => {
              const itemDisabled = isItemDisabled?.(item) ?? false;
              return (
                <button
                  key={getKey(item)}
                  type="button"
                  disabled={itemDisabled}
                  onClick={() => {
                    onSelect(item);
                    if (clearOnSelect) setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left last:border-b-0",
                    itemDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-white/5",
                  )}
                >
                  {renderItem(item)}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Строка пользователя в результатах поиска. */
export function PersonOption({
  name,
  secondary,
  hint,
}: {
  name: string;
  secondary?: string | null;
  hint?: string | null;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-foreground">{name}</p>
      {secondary ? <p className="truncate text-xs text-muted-foreground">{secondary}</p> : null}
      {hint ? <p className="truncate text-xs text-[#F35713]">{hint}</p> : null}
    </div>
  );
}

/** Выбранное значение (например, руководитель) с кнопкой сброса. */
export function SelectedChip({
  label,
  secondary,
  onClear,
  disabled,
}: {
  label: string;
  secondary?: string | null;
  onClear?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        {secondary ? <p className="truncate text-xs text-muted-foreground">{secondary}</p> : null}
      </div>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Убрать"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
