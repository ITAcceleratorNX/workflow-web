"use client";

import { useId } from "react";
import { Check, X } from "lucide-react";
import { ChoiceCard } from "@/components/ui/choice-card";
import { FieldLabel, FieldTextarea } from "@/components/ui/field";
import { RatingScale } from "@/components/ui/rating-scale";
import { ANSWER_TEXT_LIMIT, answerTextLength, chooseOption, type AnswerDraft } from "@/lib/surveys/answers";
import { scaleLabels } from "@/lib/surveys/format";
import type { SurveyQuestion } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";
import type { SurveyLayout } from "./survey-frame";

type SurveyAnswerFieldProps = {
  question: SurveyQuestion;
  answer: AnswerDraft | undefined;
  onAnswer: (answer: AnswerDraft) => void;
  layout: SurveyLayout;
};

const chosenIds = (answer: AnswerDraft | undefined) => (answer && "optionIds" in answer ? answer.optionIds : []);

/**
 * The answer to a question by its type (Figma «Вопрос 1–5»): options with a radio or checkbox,
 * the rating 1–5, the «Да / Нет» tiles or the text with its counter.
 */
export function SurveyAnswerField({ question, answer, onAnswer, layout }: SurveyAnswerFieldProps) {
  const textId = useId();
  const counterId = useId();
  const desktop = layout === "desktop";

  if (question.type === "rating") {
    const labels = scaleLabels(question);
    return (
      <RatingScale
        value={answer && "rating" in answer ? answer.rating : null}
        onChange={(rating) => onAnswer({ rating })}
        minLabel={labels.min}
        maxLabel={labels.max}
        ariaLabel={question.text}
        valueClassName={desktop ? "h-[72px]" : undefined}
      />
    );
  }

  if (question.type === "text") {
    const text = answer && "text" in answer ? answer.text : "";
    return (
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor={textId}>Ваш ответ</FieldLabel>
        <FieldTextarea
          id={textId}
          value={text}
          maxLength={ANSWER_TEXT_LIMIT}
          aria-describedby={counterId}
          onChange={(event) => onAnswer({ text: event.target.value })}
          className={cn("rounded-4pt-lg bg-ui-surface px-4 py-3.5 leading-[23px]", desktop ? "min-h-[180px]" : "min-h-[171px]")}
        />
        <p id={counterId} className="text-xs text-ui-fg/55">
          {answerTextLength(text)} / {ANSWER_TEXT_LIMIT}
        </p>
      </div>
    );
  }

  const chosen = chosenIds(answer);
  const choose = (optionId: number) => onAnswer(chooseOption(question, answer, optionId));

  if (question.type === "yes_no") {
    return (
      <div role="radiogroup" aria-label={question.text} className="grid grid-cols-2 gap-2.5">
        {/* The server creates «Да» and «Нет» in this order. */}
        {question.options.map((option, index) => (
          <ChoiceCard
            key={option.id}
            kind="radio"
            variant="tile"
            icon={index === 0 ? <Check /> : <X />}
            selected={chosen.includes(option.id)}
            onSelect={() => choose(option.id)}
          >
            {option.text}
          </ChoiceCard>
        ))}
      </div>
    );
  }

  const multiple = question.type === "multiple_choice";
  return (
    <div role={multiple ? "group" : "radiogroup"} aria-label={question.text} className="flex flex-col gap-2.5">
      {question.options.map((option) => (
        <ChoiceCard
          key={option.id}
          kind={multiple ? "checkbox" : "radio"}
          selected={chosen.includes(option.id)}
          onSelect={() => choose(option.id)}
        >
          {option.text}
        </ChoiceCard>
      ))}
    </div>
  );
}
