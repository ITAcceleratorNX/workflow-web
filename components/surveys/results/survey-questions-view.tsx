"use client";

import { officesLabel, questionSummary, questionTypeLabel, responseModeHint } from "@/lib/surveys/format";
import type { SurveyResults } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";
import { QuestionTypeIcon } from "../constructor/question-type-menu";
import type { SurveyLayout } from "../survey-frame";

/** A line of the survey's settings: «Офисы», «Режим ответов». */
function Setting({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[13px] text-ui-fg/60">{label}</dt>
      <dd className="text-[15px] font-semibold leading-5">{value}</dd>
      {hint ? <dd className="text-[13px] text-ui-fg/55">{hint}</dd> : null}
    </div>
  );
}

/**
 * «Вопросы» of a published survey (not in the mockups, agreed 03.11.2026): what the clients were
 * asked — its settings and questions with their options, as in the constructor but read-only: a
 * published survey does not change.
 */
export function SurveyQuestionsView({ results, layout }: { results: SurveyResults; layout: SurveyLayout }) {
  const desktop = layout === "desktop";
  const { survey, questions } = results;
  const card = desktop ? "rounded-4pt-lg border border-ui-fg/10 bg-ui-raised p-5" : "rounded-4pt-xl bg-ui-surface p-4";
  return (
    <div className="flex flex-col gap-4 text-ui-fg">
      <div className={cn("flex flex-col gap-4", card)}>
        {survey.description ? <p className="whitespace-pre-line text-[15px] leading-[22px] text-ui-fg/80">{survey.description}</p> : null}
        <dl className={cn("grid gap-4", desktop && "grid-cols-2")}>
          <Setting
            label="Офисы"
            value={officesLabel(survey.all_offices, survey.offices.map((office) => office.name)) ?? "—"}
          />
          <Setting
            label="Режим ответов"
            value={survey.is_anonymous ? "Анонимный" : "Именной"}
            hint={responseModeHint(survey.is_anonymous)}
          />
        </dl>
      </div>

      <p className="text-[13px] font-medium text-ui-fg/55">Вопросы · {questions.length}</p>
      <ol className="flex flex-col gap-2.5">
        {questions.map((question, index) => {
          const options = question.type === "single_choice" || question.type === "multiple_choice" ? question.options : [];
          return (
            <li key={question.id} className={cn("flex flex-col gap-1.5", card)}>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ui-accent">
                <QuestionTypeIcon type={question.type} className="size-4 shrink-0" />
                {index + 1}. {questionTypeLabel(question.type)}
              </span>
              <span className="text-[15px] font-semibold leading-5">{question.text}</span>
              <span className="text-[13px] text-ui-fg/55">{questionSummary(question.type, options.length)}</span>
              {options.length ? (
                <ul className="flex flex-col gap-1 pt-1 text-sm text-ui-fg/80">
                  {options.map((option) => (
                    <li key={option.id} className="flex items-center gap-2">
                      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-ui-fg/40" />
                      {option.text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
