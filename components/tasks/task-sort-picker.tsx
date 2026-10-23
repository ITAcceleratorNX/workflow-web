"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ListFilter } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ListGroupLabel } from "@/components/ui/list-group";
import { OptionList } from "@/components/ui/option-list";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  TASK_SORT_DIRECTIONS,
  TASK_SORT_FIELDS,
  taskSortLabel,
  type TaskSort,
  type TaskSortDirection,
  type TaskSortField,
} from "@/lib/task-list-sort";
import { cn } from "@/lib/utils";

type TaskSortPickerProps = {
  value: TaskSort;
  onChange: (sort: TaskSort) => void;
  /** `menu` — a desktop drop-down that applies at once; `sheet` — a phone sheet applied with «Готово». */
  variant: "sheet" | "menu";
};

const FIELD_OPTIONS = TASK_SORT_FIELDS.map((item) => ({ value: item.value, label: item.label }));
const DIRECTION_OPTIONS = TASK_SORT_DIRECTIONS.map((item) => ({
  value: item.value,
  label: item.label,
  icon: item.value === "asc" ? <ArrowUp /> : <ArrowDown />,
}));

/** «По сроку ↑» — the order of «Входящие» and «Сегодня» (Figma «Сортировка»). */
export function TaskSortPicker({ value, onChange, variant }: TaskSortPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const menu = variant === "menu";
  const DirectionIcon = value.direction === "asc" ? ArrowUp : ArrowDown;
  const directionLabel = TASK_SORT_DIRECTIONS.find((item) => item.value === value.direction)?.label ?? "";

  const trigger = (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={`Сортировка: ${taskSortLabel(value)}, ${directionLabel.toLowerCase()}`}
      onClick={menu ? undefined : () => {
        setDraft(value);
        setOpen(true);
      }}
      className={cn(
        "inline-flex shrink-0 items-center border bg-ui-surface font-medium text-ui-fg/90 transition-colors hover:bg-ui-fg/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
        menu
          ? cn("min-h-[37px] gap-2 rounded-[10px] px-3 text-sm text-ui-fg", open ? "border-ui-accent" : "border-ui-fg/10")
          : "min-h-[30px] gap-1.5 rounded-[14px] border-ui-fg/10 pl-2.5 pr-3 text-[13px]",
      )}
    >
      <ListFilter aria-hidden className={cn("size-4", menu ? "text-ui-accent-on-soft" : "text-ui-accent")} />
      {taskSortLabel(value)}
      <DirectionIcon aria-hidden className="size-3.5 opacity-70" />
      {menu ? <ChevronDown aria-hidden className="size-4 opacity-50" /> : null}
    </button>
  );

  if (menu) {
    const pick = (next: Partial<TaskSort>) => onChange({ ...value, ...next });
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="flex w-[280px] flex-col gap-1.5 rounded-[14px] border-ui-fg/[0.12] bg-ui-popover p-2 pb-2.5 text-ui-fg shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
        >
          <p className="pl-2 pt-1 text-xs font-medium text-ui-fg/50">Сортировать по</p>
          <OptionList<TaskSortField>
            variant="compact"
            ariaLabel="Сортировать по"
            value={value.field}
            options={FIELD_OPTIONS}
            onChange={(field) => pick({ field })}
          />
          <div aria-hidden className="h-px bg-ui-fg/[0.08]" />
          <p className="pl-2 pt-1 text-xs font-medium text-ui-fg/50">Направление</p>
          <OptionList<TaskSortDirection>
            variant="compact"
            ariaLabel="Направление"
            value={value.direction}
            options={DIRECTION_OPTIONS}
            onChange={(direction) => pick({ direction })}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {trigger}
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Сортировка"
        action={{
          label: "Готово",
          onClick: () => {
            onChange(draft);
            setOpen(false);
          },
        }}
      >
        <div className="flex flex-col gap-4">
          <ListGroupLabel>Сортировать по</ListGroupLabel>
          <OptionList<TaskSortField>
            ariaLabel="Сортировать по"
            value={draft.field}
            options={FIELD_OPTIONS}
            onChange={(field) => setDraft((current) => ({ ...current, field }))}
          />
          <ListGroupLabel>Направление</ListGroupLabel>
          <OptionList<TaskSortDirection>
            variant="compact"
            ariaLabel="Направление"
            value={draft.direction}
            options={DIRECTION_OPTIONS}
            onChange={(direction) => setDraft((current) => ({ ...current, direction }))}
          />
        </div>
      </BottomSheet>
    </>
  );
}
