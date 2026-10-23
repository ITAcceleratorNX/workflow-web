"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Building2, Check, ChevronLeft, Loader2, Search, User, Users } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FieldButton } from "@/components/ui/field";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { useRecipientPickerData } from "@/hooks/use-recipient-picker-data";
import {
  hasResults,
  RECIPIENT_SECTION_TITLES,
  selectionKey,
  type RecipientOption,
  type RecipientOptionKind,
  type RecipientSearchResult,
} from "@/lib/task-recipient-search";
import { recipientSelectionLabel, type RecipientSelection } from "@/lib/task-recipients-api";
import { cn } from "@/lib/utils";

/** `assign` — «Исполнитель» of a new task (with «Я» and teams); `transfer` — «Передать задачу». */
export type RecipientPickerMode = "assign" | "transfer";

const SELF_OPTION_KEY = "self";
const KIND_ICONS: Record<RecipientOptionKind | "self", typeof User> = {
  self: User,
  user: User,
  department: Users,
  team: Users,
  company: Building2,
};
const SECTION_ORDER: RecipientOptionKind[] = ["user", "department", "team", "company"];

type Entry = { key: string; kind: RecipientOptionKind | "self"; title: string; subtitle: string | null; selection: RecipientSelection | null };
type Section = { title: string; entries: Entry[] };

const selfEntry: Entry = { key: SELF_OPTION_KEY, kind: "self", title: "Я", subtitle: "Назначить себе", selection: null };
const toEntry = (option: RecipientOption): Entry => ({ ...option });

/** Sections of the picker: «Недавние» while the query is empty, search results otherwise. */
function buildSections(query: string, mode: RecipientPickerMode, recent: RecipientOption[], results: RecipientSearchResult): Section[] {
  if (!query.trim()) {
    const entries = [...(mode === "assign" ? [selfEntry] : []), ...recent.map(toEntry)];
    return entries.length ? [{ title: "Недавние", entries }] : [];
  }
  const groups: Record<RecipientOptionKind, RecipientOption[]> = {
    user: results.users,
    department: results.departments,
    team: results.teams,
    company: results.companies,
  };
  return SECTION_ORDER.filter((kind) => groups[kind].length > 0).map((kind) => ({
    title: RECIPIENT_SECTION_TITLES[kind],
    entries: groups[kind].map(toEntry),
  }));
}

function usePickerSections(query: string, mode: RecipientPickerMode) {
  const data = useRecipientPickerData(query, { includeTeams: mode === "assign" });
  const sections = useMemo(
    () => buildSections(query, mode, data.recentOptions, data.results),
    [query, mode, data.recentOptions, data.results],
  );
  const empty = query.trim() ? !hasResults(data.results) : sections.length === 0;
  return { ...data, sections, empty };
}

function RecipientAvatar({ kind, compact }: { kind: Entry["kind"]; compact?: boolean }) {
  const Icon = KIND_ICONS[kind];
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        compact ? "size-5 text-ui-fg/70" : "size-[34px] bg-ui-fg/[0.08] text-ui-fg/75",
      )}
    >
      <Icon className={compact ? "size-4" : "size-[18px]"} />
    </span>
  );
}

function PickerStatus({ children }: { children: ReactNode }) {
  return <p className="px-3.5 py-6 text-center text-sm text-ui-fg/55">{children}</p>;
}

type PickerStatusProps = { searching: boolean; empty: boolean; error: string | null; needsMoreLetters: boolean; onRetry: () => void; query: string };

function PickerStatuses({ searching, empty, error, needsMoreLetters, onRetry, query }: PickerStatusProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 px-3.5 py-6 text-center">
        <p className="text-sm text-ui-fg/70">{error}</p>
        <button type="button" onClick={onRetry} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-ui-accent">
          Повторить
        </button>
      </div>
    );
  }
  if (needsMoreLetters) return <PickerStatus>Введите ещё одну букву</PickerStatus>;
  if (searching) {
    return (
      <div role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-ui-fg/55">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Ищем…
      </div>
    );
  }
  if (empty && query.trim()) return <PickerStatus>Никого не нашли по запросу «{query.trim()}»</PickerStatus>;
  return null;
}

type MobileProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: RecipientSelection | null;
  onSelect: (selection: RecipientSelection | null) => void;
  mode?: RecipientPickerMode;
  title?: string;
};

/** Phone screen «Исполнитель» (Figma «Задачи · Выбор исполнителя»): search, «Недавние», results. */
export function RecipientPickerScreen({ open, onOpenChange, value, onSelect, mode = "assign", title = "Исполнитель" }: MobileProps) {
  const back = () => onOpenChange(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="inset-0 left-0 top-0 flex h-[100dvh] max-w-none translate-x-0 translate-y-0 flex-col gap-4 rounded-none border-0 bg-ui-canvas px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-ui-fg sm:rounded-none data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out"
      >
        <div className="relative flex min-h-11 items-center justify-center">
          <button
            type="button"
            onClick={back}
            className="absolute left-0 inline-flex min-h-11 items-center gap-1.5 text-lg text-ui-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
          >
            <ChevronLeft className="size-6" aria-hidden />
            Назад
          </button>
          <DialogTitle className="text-[17px] font-semibold tracking-normal text-ui-fg">{title}</DialogTitle>
        </div>
        {open ? (
          <RecipientPickerPanel
            value={value}
            mode={mode}
            onSelect={(selection) => {
              onSelect(selection);
              back();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type PanelProps = {
  value: RecipientSelection | null;
  onSelect: (selection: RecipientSelection | null) => void;
  mode: RecipientPickerMode;
  /** `window` — inside a desktop window: denser rows, the list scrolls within a fixed height. */
  density?: "screen" | "window";
};

/** Search with «Недавние» and results, for the phone screen and the desktop «Передать задачу» window. */
export function RecipientPickerPanel({ value, onSelect, mode, density = "screen" }: PanelProps) {
  const [query, setQuery] = useState("");
  const { sections, searching, empty, error, reload, needsMoreLetters, recentLoading } = usePickerSections(query, mode);
  const chosen = mode === "assign" ? selectionKey(value) : null;
  const searchId = useId();
  const isWindow = density === "window";

  return (
    <>
      <label
        htmlFor={searchId}
        className={cn(
          "flex min-h-[42px] shrink-0 items-center gap-2 rounded-xl px-3",
          isWindow ? "border border-ui-fg/10 bg-ui-fg/[0.03] focus-within:border-ui-accent" : "bg-ui-surface",
        )}
      >
        <Search className="size-5 text-ui-fg/50" aria-hidden />
        <span className="sr-only">Поиск получателя</span>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по имени или отделу"
          autoComplete="off"
          autoFocus={isWindow}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ui-fg placeholder:text-ui-fg/40 focus-visible:outline-none"
        />
      </label>
      <div className={cn("flex min-h-0 flex-col gap-4 overflow-y-auto", isWindow ? "h-[360px]" : "-mx-4 flex-1 px-4")}>
        <PickerStatuses searching={searching} empty={empty} error={error} needsMoreLetters={needsMoreLetters} onRetry={reload} query={query} />
        {!query.trim() && recentLoading && mode === "transfer" ? (
          <div role="status" className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-ui-fg/50" aria-label="Загрузка" />
          </div>
        ) : null}
        {!query.trim() && !recentLoading && sections.length === 0 ? (
          <PickerStatus>Начните вводить имя, отдел или компанию</PickerStatus>
        ) : null}
        {sections.map((section) => (
          <section key={section.title} aria-label={section.title} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ui-fg/50">{section.title}</p>
            <div
              className={cn(
                "overflow-hidden rounded-2xl [&>*+*]:border-t [&>*+*]:border-ui-fg/[0.06]",
                isWindow ? "bg-ui-fg/[0.03]" : "bg-ui-surface",
              )}
            >
              {section.entries.map((entry) => {
                const selected = entry.key === chosen;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelect(entry.selection)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3.5 text-left transition-colors hover:bg-ui-fg/[0.04] focus-visible:bg-ui-fg/[0.06] focus-visible:outline-none",
                      isWindow ? "py-2.5" : "py-3",
                    )}
                  >
                    <RecipientAvatar kind={entry.kind} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={cn("truncate text-ui-fg", isWindow ? "text-[15px]" : "text-base", selected && "font-semibold")}>
                        {entry.title}
                      </span>
                      {entry.subtitle ? <span className="truncate text-[13px] text-ui-fg/50">{entry.subtitle}</span> : null}
                    </span>
                    {selected ? <Check className="size-[22px] shrink-0 text-ui-accent" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

type ComboboxProps = {
  value: RecipientSelection | null;
  onSelect: (selection: RecipientSelection | null) => void;
  mode?: RecipientPickerMode;
  /** id of the visible caption («Исполнитель»). */
  labelId: string;
};

/** Desktop «Исполнитель» field: shows the choice, turns into a search box with a list below. */
export function RecipientCombobox({ value, onSelect, mode = "assign", labelId }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  /** Return focus to the field once it is back on the screen (after a choice or Esc). */
  const refocusField = useRef(false);
  const listId = useId();
  const { sections, searching, empty, error, reload, needsMoreLetters } = usePickerSections(open ? query : "", mode);
  const entries = useMemo(() => sections.flatMap((section) => section.entries), [sections]);
  const chosen = selectionKey(value);
  const label = value ? recipientSelectionLabel(value) : "Я";

  useEffect(() => setActive(0), [query, open]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (refocusField.current) {
      refocusField.current = false;
      buttonRef.current?.focus();
    }
  }, [open]);

  const close = (focusButton = true) => {
    refocusField.current = focusButton;
    setOpen(false);
    setQuery("");
  };
  const choose = (entry: Entry) => {
    onSelect(entry.selection);
    close();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(entries.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const entry = entries[active];
      if (entry) choose(entry);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  let flatIndex = -1;
  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close(false))}>
      <PopoverAnchor asChild>
        <div ref={anchorRef}>
          {open ? (
            <div className="flex h-[43px] items-center gap-2.5 rounded-xl border border-ui-accent bg-ui-fg/[0.03] pl-3.5 pr-3 ring-1 ring-ui-accent">
              <Search className="size-4 shrink-0 text-ui-fg/60" aria-hidden />
              <input
                ref={inputRef}
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-labelledby={labelId}
                aria-autocomplete="list"
                aria-activedescendant={entries[active] ? `${listId}-${entries[active].key}` : undefined}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Имя, отдел или команда"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ui-fg placeholder:text-ui-fg/40 focus-visible:outline-none"
              />
            </div>
          ) : (
            <FieldButton
              ref={buttonRef}
              aria-labelledby={labelId}
              aria-haspopup="listbox"
              icon={<RecipientAvatar kind={value?.type === "company" ? "company" : value?.type === "department" || value?.type === "team" ? "team" : "user"} compact />}
              onClick={() => setOpen(true)}
            >
              {label}
            </FieldButton>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        // Esc closes the list only (not the window around it) and puts focus back on the field.
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          close();
        }}
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
        // A combobox list disappears at once: while a closing animation ran, the list already showed
        // «Недавние» for the cleared query and looked like it had opened again.
        className="max-h-[320px] w-[var(--radix-popover-trigger-width)] min-w-[274px] overflow-y-auto rounded-xl border-ui-fg/[0.12] bg-ui-popover p-0 py-1.5 text-ui-fg shadow-[0_12px_30px_rgba(0,0,0,0.55)] data-[state=closed]:animate-none"
      >
        <div id={listId} role="listbox" aria-labelledby={labelId}>
          <PickerStatuses searching={searching} empty={empty} error={error} needsMoreLetters={needsMoreLetters} onRetry={reload} query={query} />
          {sections.map((section) => (
            <div key={section.title} role="group" aria-label={section.title}>
              <p className="px-3.5 pb-1 pt-2 text-[11px] font-semibold uppercase text-ui-fg/45">{section.title}</p>
              {section.entries.map((entry) => {
                flatIndex += 1;
                const index = flatIndex;
                const selected = entry.key === chosen;
                return (
                  <div
                    key={entry.key}
                    id={`${listId}-${entry.key}`}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(entry)}
                    className={cn("flex cursor-pointer items-center gap-2.5 px-3.5 py-2", index === active && "bg-ui-fg/[0.06]")}
                  >
                    <RecipientAvatar kind={entry.kind} compact />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{entry.title}</span>
                      {entry.subtitle ? <span className="truncate text-xs text-ui-fg/50">{entry.subtitle}</span> : null}
                    </span>
                    {selected ? <Check className="size-4 shrink-0 text-ui-accent-on-soft" aria-hidden /> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
