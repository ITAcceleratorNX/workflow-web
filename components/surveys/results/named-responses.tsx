"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useNamedResponses } from "@/hooks/use-named-responses";
import { namedAnswerText, NO_ANSWER, respondentLabel } from "@/lib/surveys/format";
import { answersByQuestion } from "@/lib/surveys/results";
import type { SurveyQuestionResult } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";
import { momentLabel } from "../admin-survey-card";
import { SurveyRetryButton, type SurveyLayout } from "../survey-frame";
import { NoResponses } from "./results-summary";

type NamedResponsesProps = {
  surveyId: number;
  /** The questions of the survey, in its order: the answers of each person follow it. */
  questions: readonly SurveyQuestionResult[];
  layout: SurveyLayout;
  /** Today in the time zone of the app, YYYY-MM-DD: «сегодня, 10:40». */
  todayKey: string;
};

/**
 * «Ответы» of a named survey (ТЗ: «ФИО и ответы человека»; not in the mockups, agreed 03.11.2026):
 * who answered and when, newest first, with all their answers; «Показать ещё» by 20.
 */
export function NamedResponses({ surveyId, questions, layout, todayKey }: NamedResponsesProps) {
  const desktop = layout === "desktop";
  const { responses, loading, error, hasMore, loadNext } = useNamedResponses(surveyId);
  const card = desktop ? "rounded-4pt-lg border border-ui-fg/10 bg-ui-raised p-5" : "rounded-4pt-xl bg-ui-surface p-4";

  if (!responses.length) {
    if (error && !loading) {
      return (
        <div role="alert" className="pt-10">
          <EmptyState
            icon={<AlertCircle />}
            title="Не удалось загрузить ответы"
            description={error}
            action={<SurveyRetryButton onClick={loadNext} />}
          />
        </div>
      );
    }
    if (loading) {
      return (
        <div role="status" aria-label="Загружаем ответы" className="flex flex-col gap-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className={cn("h-[168px] animate-pulse", card)} />
          ))}
        </div>
      );
    }
    return <NoResponses layout={layout} />;
  }

  return (
    <div className="flex flex-col gap-3 text-ui-fg">
      <ul className="flex flex-col gap-3">
        {responses.map((response) => (
          <li key={response.id} className={cn("flex flex-col gap-3", card)}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-base font-bold">{respondentLabel(response.respondent)}</span>
              <span className="text-[13px] text-ui-fg/55">{momentLabel(response.submitted_at, todayKey, true)}</span>
            </div>
            <dl className="flex flex-col gap-2.5">
              {answersByQuestion(questions, response).map(({ question, answer }, index) => (
                <div key={question.id} className="flex flex-col gap-0.5">
                  <dt className="text-[13px] text-ui-fg/55">
                    {index + 1}. {question.text}
                  </dt>
                  <dd className={cn("whitespace-pre-line break-words text-[15px] leading-5", !answer && "text-ui-fg/40")}>
                    {answer ? namedAnswerText(answer) : NO_ANSWER}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      {error && !loading ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-ui-danger">
          <span>
            Не удалось загрузить ответы. {error}
          </span>
          <SurveyRetryButton onClick={loadNext} />
        </div>
      ) : hasMore ? (
        <Button
          variant="neutral-outline"
          size="md"
          onClick={loadNext}
          disabled={loading}
          aria-busy={loading}
          className={cn("rounded-[10px] text-sm", desktop ? "w-fit self-center px-5" : "w-full")}
        >
          {loading ? <Loader2 aria-hidden className="animate-spin" /> : null}
          Показать ещё
        </Button>
      ) : null}
    </div>
  );
}
