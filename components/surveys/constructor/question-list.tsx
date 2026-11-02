"use client";

import { PenLine, Trash2 } from "lucide-react";
import { filledOptions, isChoiceQuestion, type DraftQuestion, type QuestionProblems } from "@/lib/surveys/draft";
import { questionSummary, questionTypeLabel } from "@/lib/surveys/format";
import { cn } from "@/lib/utils";
import type { SurveyLayout } from "../survey-frame";
import { QuestionTypeIcon } from "./question-type-menu";

type QuestionListProps = {
  questions: readonly DraftQuestion[];
  layout: SurveyLayout;
  /** Вопросы с ошибками, когда их пора показывать. */
  problems: Readonly<Record<string, QuestionProblems>> | null;
  /** Desktop: the question open in the panel. */
  selectedKey?: string | null;
  /** Desktop: the card opens the question in the panel; Mobile: the card and the pencil open «Вопрос N». */
  onOpen: (key: string) => void;
  onDelete: (key: string) => void;
};

const ICON_BUTTON =
  "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-ui-fg/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70 [&_svg]:size-5";

/**
 * Questions of the constructor (Figma «Форма с первым вопросом», «Все 5 вопросов добавлены»): the
 * number and type, the text and what the client gets; edit and delete.
 */
export function QuestionList({ questions, layout, problems, selectedKey, onOpen, onDelete }: QuestionListProps) {
  const desktop = layout === "desktop";
  return (
    <ol className="flex flex-col gap-2.5">
      {questions.map((question, index) => {
        const number = index + 1;
        const invalid = Boolean(problems?.[question.key]);
        const selected = desktop && question.key === selectedKey;
        const summary = questionSummary(question.type, isChoiceQuestion(question.type) ? filledOptions(question).length : 0);
        return (
          <li
            key={question.key}
            className={cn(
              "flex items-start gap-2 border",
              desktop ? "rounded-4pt-md px-4 py-3" : "rounded-4pt-lg py-3 pl-4 pr-2",
              selected ? "border-ui-accent bg-ui-selected" : invalid ? "border-ui-danger/70 bg-ui-surface" : "border-ui-fg/10 bg-ui-surface",
            )}
          >
            <button
              type="button"
              aria-pressed={desktop ? selected : undefined}
              onClick={() => onOpen(question.key)}
              className="flex min-w-0 flex-1 flex-col items-start gap-1 rounded-4pt-xs text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
            >
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ui-accent">
                <QuestionTypeIcon type={question.type} className="size-4" />
                {number}. {questionTypeLabel(question.type)}
              </span>
              <span className="text-[15px] font-semibold leading-5 text-ui-fg">{question.text.trim()}</span>
              <span className="text-[13px] text-ui-fg/55">{summary}</span>
            </button>
            <div className={cn("flex shrink-0", desktop ? "items-center" : "flex-col gap-1")}>
              {desktop ? null : (
                <button type="button" aria-label={`Изменить вопрос ${number}`} onClick={() => onOpen(question.key)} className={cn(ICON_BUTTON, "text-ui-fg")}>
                  <PenLine aria-hidden />
                </button>
              )}
              <button type="button" aria-label={`Удалить вопрос ${number}`} onClick={() => onDelete(question.key)} className={cn(ICON_BUTTON, "text-ui-danger")}>
                <Trash2 aria-hidden />
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
