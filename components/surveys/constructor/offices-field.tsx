"use client";

import { useId, useState, type Ref } from "react";
import { Building2, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ChoiceCard } from "@/components/ui/choice-card";
import { FieldButton, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOffices } from "@/hooks/use-offices";
import { officesLabel } from "@/lib/surveys/format";
import { cn } from "@/lib/utils";
import type { SurveyLayout } from "../survey-frame";

type OfficesFieldProps = {
  layout: SurveyLayout;
  allOffices: boolean;
  officeIds: readonly number[];
  onToggleAll: () => void;
  onToggle: (officeId: number, allIds: readonly number[]) => void;
  /** «Выберите офисы»: «Опубликовать» без офисов. */
  error?: string;
  /** The field: the form puts the focus on its first error. */
  buttonRef?: Ref<HTMLButtonElement>;
};

/**
 * «Офисы»: кому опрос (нет в макетах — по ТЗ существующими элементами): поле открывает список
 * с галочками — нижнюю панель на Mobile, меню на Desktop. «Все офисы» — и те, что появятся позже.
 */
export function OfficesField({ layout, allOffices, officeIds, onToggleAll, onToggle, error, buttonRef }: OfficesFieldProps) {
  const desktop = layout === "desktop";
  const labelId = useId();
  const errorId = useId();
  const [open, setOpen] = useState(false);
  const { offices, loading } = useOffices();
  const allIds = offices.map((office) => office.id);
  const value = officesLabel(
    allOffices,
    offices.filter((office) => officeIds.includes(office.id)).map((office) => office.name),
  );

  const list = (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <ChoiceCard kind="checkbox" selected={allOffices} onSelect={onToggleAll} className={cn(desktop && "min-h-11 py-2")}>
        Все офисы
      </ChoiceCard>
      {offices.map((office) => (
        <ChoiceCard
          key={office.id}
          kind="checkbox"
          selected={allOffices || officeIds.includes(office.id)}
          onSelect={() => onToggle(office.id, allIds)}
          className={cn(desktop && "min-h-11 py-2")}
        >
          {office.name}
        </ChoiceCard>
      ))}
      {loading ? <Loader2 aria-hidden className="mx-auto size-5 animate-spin text-ui-fg/50" /> : null}
    </div>
  );

  const trigger = (
    <FieldButton
      ref={buttonRef}
      aria-labelledby={labelId}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
      icon={<Building2 />}
      active={open}
      onClick={desktop ? undefined : () => setOpen(true)}
      className={desktop ? "h-12" : "h-[50px] bg-ui-surface"}
    >
      {loading && !allOffices && officeIds.length ? (
        <Loader2 aria-hidden className="size-4 animate-spin text-ui-fg/50" />
      ) : (
        value ?? <span className="text-ui-fg/40">Выберите офисы</span>
      )}
    </FieldButton>
  );

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel id={labelId}>Офисы *</FieldLabel>
      {desktop ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="max-h-[360px] w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-[14px] border-ui-fg/[0.12] bg-ui-popover p-2 text-ui-fg shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
          >
            {list}
          </PopoverContent>
        </Popover>
      ) : (
        <>
          {trigger}
          <BottomSheet open={open} onOpenChange={setOpen} title="Офисы">
            {list}
          </BottomSheet>
        </>
      )}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
