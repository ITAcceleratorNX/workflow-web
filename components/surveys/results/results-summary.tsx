"use client";

import { ChartColumn } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTimeOnly, toAppDateKey } from "@/lib/dateTimeUtils";
import { resultsDateLabel, resultsMoment } from "@/lib/surveys/format";
import type { AdminSurvey } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";
import type { SurveyLayout } from "../survey-frame";

type ResultsSummaryProps = {
  survey: AdminSurvey;
  layout: SurveyLayout;
  /** Today in the time zone of the app, YYYY-MM-DD: «сегодня, 09:15». */
  todayKey: string;
};

/**
 * The summary over the results (Figma 54-2701 / 54-5745): answers received, questions (Desktop) and
 * when the survey was published — or closed, once it is.
 */
export function ResultsSummary({ survey, layout, todayKey }: ResultsSummaryProps) {
  const desktop = layout === "desktop";
  const moment = resultsMoment(survey);
  const cells = [
    { label: "Ответов получено", value: String(survey.responses_count), big: true },
    ...(desktop ? [{ label: "Вопросов", value: String(survey.questions_count), big: true }] : []),
    ...(moment
      ? [{ label: moment.label, value: resultsDateLabel(toAppDateKey(moment.iso), formatTimeOnly(moment.iso), todayKey, layout), big: false }]
      : []),
  ];

  return (
    <dl
      className={cn(
        "grid",
        desktop ? "grid-cols-3 rounded-4pt-lg border border-ui-fg/10 bg-ui-raised" : "grid-cols-2 rounded-4pt-xl bg-ui-surface",
      )}
    >
      {cells.map((cell, index) => (
        <div
          key={cell.label}
          className={cn(
            "flex min-w-0 flex-col gap-1.5",
            desktop ? "px-6 py-5" : "px-4 py-3.5",
            // A line of its own on each cell, not `divide-*`: the legacy borders of the page skip `border-ui-*` only.
            desktop && index > 0 && "border-l border-ui-fg/10",
          )}
        >
          <dt className="text-[13px] text-ui-fg/60">{cell.label}</dt>
          <dd
            className={cn(
              "font-bold text-ui-fg",
              cell.big ? (desktop ? "text-[32px] leading-[38px]" : "text-[30px] leading-9") : desktop ? "pt-1 text-xl" : "pt-1 text-[17px]",
            )}
          >
            {cell.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** «Пока нет ответов» (Figma 54-2665 / 54-5654): the results and the answers of a survey nobody has taken. */
export function NoResponses({ layout }: { layout: SurveyLayout }) {
  const state = (
    <EmptyState
      tile="neutral"
      icon={<ChartColumn />}
      title="Пока нет ответов"
      description="Диаграммы и комментарии появятся, когда клиенты начнут проходить опрос"
    />
  );
  if (layout === "mobile") return <div className="pt-16">{state}</div>;
  return <div className="rounded-4pt-lg border border-ui-fg/10 bg-ui-raised px-6 py-24">{state}</div>;
}
