"use client";

import type { ReactNode } from "react";
import { AlignLeft, ChevronRight, CircleDot, SquareCheck, Star, ToggleRight, type LucideIcon } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QUESTION_TYPE_ORDER, questionTypeDescription, questionTypeLabel } from "@/lib/surveys/format";
import type { SurveyQuestionType } from "@/lib/surveys/types";
import type { SurveyLayout } from "../survey-frame";

const TYPE_ICONS: Record<SurveyQuestionType, LucideIcon> = {
  single_choice: CircleDot,
  multiple_choice: SquareCheck,
  text: AlignLeft,
  rating: Star,
  yes_no: ToggleRight,
};

/** The icon of a question type (Figma «Тип вопроса»). */
export function QuestionTypeIcon({ type, className }: { type: SurveyQuestionType; className?: string }) {
  const Icon = TYPE_ICONS[type];
  return <Icon aria-hidden className={className} />;
}

type QuestionTypeMenuProps = {
  layout: SurveyLayout;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: SurveyQuestionType) => void;
  /** The button that opens the menu: on Desktop the menu hangs from it. */
  trigger: ReactNode;
};

/**
 * The type of a new question (Figma «Тип вопроса»): a bottom sheet with the five types on Mobile,
 * the menu «Тип нового вопроса» under its button on Desktop.
 */
export function QuestionTypeMenu({ layout, open, onOpenChange, onSelect, trigger }: QuestionTypeMenuProps) {
  const pick = (type: SurveyQuestionType) => {
    onOpenChange(false);
    onSelect(type);
  };

  if (layout === "desktop") {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="flex w-[372px] flex-col gap-0.5 rounded-[14px] border-ui-fg/[0.12] bg-ui-popover p-2 text-ui-fg shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
        >
          <p className="px-2 pb-1 pt-1 text-xs font-medium text-ui-fg/50">Тип нового вопроса</p>
          {QUESTION_TYPE_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => pick(type)}
              className="flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-ui-accent-soft focus-visible:bg-ui-accent-soft focus-visible:outline-none"
            >
              <QuestionTypeIcon type={type} className="size-[18px] shrink-0 text-ui-accent" />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">{questionTypeLabel(type)}</span>
                <span className="text-xs text-ui-fg/55">{questionTypeDescription(type)}</span>
              </span>
            </button>
          ))}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {trigger}
      <BottomSheet open={open} onOpenChange={onOpenChange} title="Тип вопроса">
        <div className="flex flex-col divide-y divide-ui-fg/10 border-y border-ui-fg/10">
          {QUESTION_TYPE_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => pick(type)}
              className="flex items-center gap-3.5 py-3 text-left text-ui-fg transition-colors hover:bg-ui-fg/[0.04] focus-visible:bg-ui-fg/[0.06] focus-visible:outline-none"
            >
              <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-4pt-md bg-ui-accent-soft text-ui-accent">
                <QuestionTypeIcon type={type} className="size-[22px]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-semibold">{questionTypeLabel(type)}</span>
                <span className="text-[13px] text-ui-fg/55">{questionTypeDescription(type)}</span>
              </span>
              <ChevronRight aria-hidden className="size-5 shrink-0 text-ui-fg/35" />
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
