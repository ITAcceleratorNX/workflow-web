"use client";

import { useId, useState, type ReactNode } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareBar } from "@/components/ui/share-bar";
import {
  averageLabel,
  MULTIPLE_RESULT_HINT,
  questionResultHeading,
  respondentLabel,
  showAllAnswersLabel,
  textAnswersLabel,
} from "@/lib/surveys/format";
import { ratingRows } from "@/lib/surveys/results";
import type { SurveyQuestionResult } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";
import { QuestionTypeIcon } from "../constructor/question-type-menu";
import type { SurveyLayout } from "../survey-frame";

/** Text answers shown before «Показать все N ответов» (Figma: three). */
const FIRST_ANSWERS = 3;

/** «12 · 52%»: the count, then its share. */
function CountShare({ count, percent }: { count: number; percent: number }) {
  return (
    <span className="shrink-0 tabular-nums text-ui-fg/60">
      <b className="font-semibold text-ui-fg">{count}</b> · {percent}%
    </span>
  );
}

/** A row of a list of shares: the label and «12 · 52%», the bar under them. */
function ShareRow({ label, count, percent }: { label: ReactNode; count: number; percent: number }) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-[15px] leading-5">
        <span className="min-w-0">{label}</span>
        <CountShare count={count} percent={percent} />
      </div>
      <ShareBar parts={[{ percent, tone: "accent" }]} />
    </li>
  );
}

/** The answers to an open question: three, then all of them; in a named survey with their authors. */
function TextAnswers({ question, layout }: { question: Extract<SurveyQuestionResult, { type: "text" }>; layout: SurveyLayout }) {
  const desktop = layout === "desktop";
  const listId = useId();
  const [all, setAll] = useState(false);
  const count = question.answers.length;
  const shown = all ? question.answers : question.answers.slice(0, FIRST_ANSWERS);
  return (
    <>
      <p className="text-[13px] text-ui-fg/55">{textAnswersLabel(count)}</p>
      <ul id={listId} className="flex flex-col gap-2">
        {shown.map((answer, index) => (
          <li
            key={index}
            className={cn(
              "flex flex-col gap-1 rounded-[10px] px-3.5 py-3 text-[15px] leading-5",
              desktop ? "bg-ui-surface" : "bg-ui-fg/[0.05]",
            )}
          >
            {/* The author — only in a named survey: the server sends none in an anonymous one. */}
            {answer.respondent ? (
              <span className="text-[13px] font-semibold text-ui-fg/60">{respondentLabel(answer.respondent)}</span>
            ) : null}
            <span className="whitespace-pre-line break-words">{answer.text}</span>
          </li>
        ))}
      </ul>
      {count > FIRST_ANSWERS ? (
        <Button
          variant="neutral-outline"
          size="md"
          aria-expanded={all}
          aria-controls={listId}
          onClick={() => setAll((open) => !open)}
          className={cn("rounded-[10px] text-sm", desktop ? "w-fit px-4" : "w-full")}
        >
          {all ? "Свернуть" : showAllAnswersLabel(count)}
        </Button>
      ) : null}
    </>
  );
}

function ResultBody({ question, layout }: { question: SurveyQuestionResult; layout: SurveyLayout }) {
  switch (question.type) {
    case "single_choice":
    case "multiple_choice":
      return (
        <>
          {question.type === "multiple_choice" ? <p className="text-[13px] text-ui-fg/55">{MULTIPLE_RESULT_HINT}</p> : null}
          <ul className="flex flex-col gap-3">
            {question.options.map((option) => (
              <ShareRow key={option.id} label={option.text} count={option.count} percent={option.percent} />
            ))}
          </ul>
        </>
      );
    case "yes_no": {
      const [yes, no] = question.options;
      return (
        <div className="flex flex-col gap-2.5 pt-1">
          <ShareBar
            thick
            parts={[
              { percent: yes?.percent ?? 0, tone: "accent" },
              { percent: no?.percent ?? 0, tone: "neutral" },
            ]}
          />
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
            {[
              { option: yes, tone: "bg-ui-accent" },
              { option: no, tone: "bg-ui-fg/30" },
            ].map(({ option, tone }) =>
              option ? (
                <span key={option.id} className="inline-flex items-center gap-1.5">
                  <span aria-hidden className={cn("size-2.5 rounded-[3px]", tone)} />
                  {option.text} · <CountShare count={option.count} percent={option.percent} />
                </span>
              ) : null,
            )}
          </div>
        </div>
      );
    }
    case "rating":
      return (
        <>
          <p className="flex items-baseline gap-2.5">
            <span className={cn("font-bold leading-none", layout === "desktop" ? "text-[40px]" : "text-[44px]")}>
              {question.average == null ? "—" : averageLabel(question.average)}
            </span>
            <span className="text-[15px] text-ui-fg/55">средняя оценка из 5</span>
          </p>
          <ul className="flex flex-col gap-3">
            {ratingRows(question).map((row) => (
              <ShareRow
                key={row.value}
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <span className="sr-only">Оценка </span>
                    {row.value}
                    <Star aria-hidden className="size-3.5 text-ui-accent" />
                  </span>
                }
                count={row.count}
                percent={row.percent}
              />
            ))}
          </ul>
        </>
      );
    case "text":
      return <TextAnswers question={question} layout={layout} />;
  }
}

type QuestionResultCardProps = {
  question: SurveyQuestionResult;
  /** The place of the question in the survey, from zero. */
  index: number;
  layout: SurveyLayout;
  className?: string;
};

/**
 * The results of a question (Figma 54-2701 / 54-5745): shares of the options with bars, the average
 * and the spread of ratings, «Да / Нет» on one bar, the text answers.
 */
export function QuestionResultCard({ question, index, layout, className }: QuestionResultCardProps) {
  const desktop = layout === "desktop";
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex min-w-0 flex-col text-ui-fg",
        desktop ? "gap-3.5 rounded-4pt-lg border border-ui-fg/10 bg-ui-raised p-5" : "gap-3 rounded-4pt-xl bg-ui-surface p-4",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ui-accent">
        <QuestionTypeIcon type={question.type} className="size-4 shrink-0" />
        {questionResultHeading(index, question.type)}
      </p>
      <h3 id={titleId} className={cn("font-bold", desktop ? "text-base leading-[21px]" : "text-[17px] leading-[22px]")}>
        {question.text}
      </h3>
      <ResultBody question={question} layout={layout} />
    </section>
  );
}
