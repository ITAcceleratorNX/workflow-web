"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipTabs } from "@/components/ui/chip-tabs";
import { FieldButton, FieldInput, FieldLabel, FieldTextarea } from "@/components/ui/field";
import {
  addOption,
  changeOption,
  DRAFT_LIMITS,
  isChoiceQuestion,
  removeOption,
  withType,
  type DraftQuestion,
  type NextKey,
  type QuestionProblems,
} from "@/lib/surveys/draft";
import { QUESTION_TYPE_ORDER, questionEditorHint, questionTypeLabel } from "@/lib/surveys/format";
import type { SurveyQuestionType } from "@/lib/surveys/types";
import type { SurveyLayout } from "../survey-frame";
import { QuestionTypeIcon, QuestionTypeMenu } from "./question-type-menu";

const TYPE_TABS = QUESTION_TYPE_ORDER.map((type) => ({ value: type, label: questionTypeLabel(type) }));

/** A label above a block that is not one input. */
const BlockLabel = ({ id, children }: { id?: string; children: ReactNode }) => (
  <p id={id} className="text-[13px] font-medium text-ui-fg/55">
    {children}
  </p>
);

/** An error under a field, read with it (aria-describedby). */
export const FieldError = ({ id, children }: { id: string; children: ReactNode }) => (
  <p id={id} className="text-[13px] text-ui-danger">
    {children}
  </p>
);

/** «Как увидит клиент»: a still picture of the rating, «Да / Нет» or the open answer. */
function ClientPreview({ type }: { type: SurveyQuestionType }) {
  if (type === "rating") {
    return (
      <div aria-hidden className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <span key={value} className="flex h-12 flex-1 items-center justify-center rounded-4pt-md border border-ui-fg/10 bg-ui-surface text-lg font-bold text-ui-fg/80">
            {value}
          </span>
        ))}
      </div>
    );
  }
  if (type === "yes_no") {
    return (
      <div aria-hidden className="grid grid-cols-2 gap-2.5">
        {[
          { label: "Да", icon: <Check className="size-[18px]" /> },
          { label: "Нет", icon: <X className="size-[18px]" /> },
        ].map(({ label, icon }) => (
          <span key={label} className="flex h-14 items-center justify-center gap-2 rounded-4pt-md border border-ui-fg/10 bg-ui-surface text-base font-bold text-ui-fg/80">
            {icon}
            {label}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div aria-hidden className="min-h-[88px] rounded-4pt-lg border border-dashed border-ui-fg/20 px-4 py-3 text-ui-fg/40">
      Ваш ответ
    </div>
  );
}

type QuestionEditorProps = {
  question: DraftQuestion;
  layout: SurveyLayout;
  /** Errors of the question, when it is time to show them. */
  problems: QuestionProblems | null;
  nextKey: NextKey;
  onChange: (question: DraftQuestion) => void;
};

/**
 * A question of the constructor (Figma «Вопрос 1 — один вариант» … «Вопрос 5 — открытый ответ»):
 * its type, text and options, or what the client gets for the other types.
 */
export function QuestionEditor({ question, layout, problems, nextKey, onChange }: QuestionEditorProps) {
  const desktop = layout === "desktop";
  const textId = useId();
  const textErrorId = useId();
  const optionsId = useId();
  const optionsErrorId = useId();
  const [typeMenu, setTypeMenu] = useState(false);
  const optionInputs = useRef(new Map<string, HTMLInputElement>());
  const [focusOption, setFocusOption] = useState<string | null>(null);
  const hint = questionEditorHint(question.type);

  // A new option takes the focus: the admin types it right away.
  useEffect(() => {
    if (!focusOption) return;
    optionInputs.current.get(focusOption)?.focus();
  }, [focusOption]);

  const setType = (type: SurveyQuestionType) => {
    if (type !== question.type) onChange(withType(question, type, nextKey));
  };
  const add = () => {
    const next = addOption(question, nextKey);
    onChange(next);
    setFocusOption(next.options.at(-1)?.key ?? null);
  };

  return (
    <div className="flex flex-col gap-4 text-ui-fg">
      <div className="flex flex-col gap-2">
        <BlockLabel>Тип ответа</BlockLabel>
        {desktop ? (
          <ChipTabs variant="solid" size="md" ariaLabel="Тип ответа" value={question.type} onChange={setType} tabs={TYPE_TABS} />
        ) : (
          <QuestionTypeMenu
            layout="mobile"
            open={typeMenu}
            onOpenChange={setTypeMenu}
            onSelect={setType}
            trigger={
              <FieldButton
                aria-label={`Тип ответа: ${questionTypeLabel(question.type)}`}
                aria-haspopup="dialog"
                icon={<QuestionTypeIcon type={question.type} className="text-ui-accent" />}
                onClick={() => setTypeMenu(true)}
                className="h-[50px] bg-ui-surface"
              >
                {questionTypeLabel(question.type)}
              </FieldButton>
            }
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor={textId}>Текст вопроса *</FieldLabel>
        <FieldTextarea
          id={textId}
          value={question.text}
          maxLength={DRAFT_LIMITS.questionText}
          aria-invalid={Boolean(problems?.text)}
          aria-describedby={problems?.text ? textErrorId : undefined}
          onChange={(event) => onChange({ ...question, text: event.target.value })}
          className="min-h-[74px] bg-ui-surface leading-[22px]"
        />
        {problems?.text ? <FieldError id={textErrorId}>{problems.text}</FieldError> : null}
      </div>

      {isChoiceQuestion(question.type) ? (
        <div className="flex flex-col gap-2">
          <BlockLabel id={optionsId}>Варианты ответа</BlockLabel>
          <ul aria-labelledby={optionsId} className="flex flex-col gap-2">
            {question.options.map((option, index) => (
              <li key={option.key} className="flex items-center gap-1.5">
                <FieldInput
                  ref={(input) => {
                    if (input) optionInputs.current.set(option.key, input);
                    else optionInputs.current.delete(option.key);
                  }}
                  aria-label={`Вариант ${index + 1}`}
                  aria-invalid={Boolean(problems?.options)}
                  aria-describedby={problems?.options ? optionsErrorId : undefined}
                  value={option.text}
                  maxLength={DRAFT_LIMITS.optionText}
                  onChange={(event) => onChange(changeOption(question, option.key, event.target.value))}
                  className="h-12 flex-1 bg-ui-surface"
                />
                <button
                  type="button"
                  aria-label={`Удалить вариант ${index + 1}`}
                  onClick={() => onChange(removeOption(question, option.key))}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-ui-danger transition-colors hover:bg-ui-fg/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </li>
            ))}
          </ul>
          <Button
            variant="accent-outline"
            onClick={add}
            disabled={question.options.length >= DRAFT_LIMITS.options.max}
            className="h-12 w-full rounded-4pt-md border-dashed border-ui-fg/20 text-[15px]"
          >
            <Plus aria-hidden />
            Добавить вариант
          </Button>
          {problems?.options ? <FieldError id={optionsErrorId}>{problems.options}</FieldError> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <BlockLabel>Как увидит клиент</BlockLabel>
          <ClientPreview type={question.type} />
        </div>
      )}

      {hint ? <p className="text-[13px] text-ui-fg/55">{hint}</p> : null}
    </div>
  );
}
