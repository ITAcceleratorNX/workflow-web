"use client";

import Link from "next/link";
import { ChevronRight, Clock, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNewsDisplayDate } from "@/constants/news-filters";
import { toAppDateKey } from "@/lib/dateTimeUtils";
import { completedLabel, durationLabel, questionsCountLabel } from "@/lib/surveys/format";
import { surveyHref } from "@/lib/surveys/routes";
import type { ClientSurvey } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";

type SurveyCardProps = {
  survey: ClientSurvey;
  /** Today in the time zone of the app, YYYY-MM-DD: «Пройдено сегодня». */
  todayKey: string;
  layout: "mobile" | "desktop";
};

function Meta({ survey, layout }: Pick<SurveyCardProps, "survey" | "layout">) {
  const desktop = layout === "desktop";
  const icon = desktop ? "size-[15px]" : "size-4";
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center text-ui-fg/60", desktop ? "gap-3.5 text-[13px]" : "gap-4 text-sm")}>
      <span className="inline-flex items-center gap-1.5">
        <List className={icon} aria-hidden />
        {questionsCountLabel(survey.questions_count)}
      </span>
      {survey.estimated_minutes != null ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock className={icon} aria-hidden />
          {durationLabel(survey.estimated_minutes)}
        </span>
      ) : null}
    </div>
  );
}

/**
 * A survey in the client's list (Figma «Список опросов»): an open one leads to the survey —
 * the whole card on Mobile, «Пройти опрос» on Desktop; a completed one is dimmed and says when.
 */
export function SurveyCard({ survey, todayKey, layout }: SurveyCardProps) {
  const completed = survey.state === "completed";
  const desktop = layout === "desktop";
  const description = completed && survey.completed_at
    ? completedLabel(toAppDateKey(survey.completed_at), todayKey)
    : survey.description;

  const body = (
    <div className={cn("flex flex-col", desktop ? "gap-2.5" : "gap-2.5 p-3.5")}>
      <div className="flex items-center justify-between gap-3">
        <Badge variant="accent">Опрос</Badge>
        {completed ? (
          <Badge variant="success">Пройдено</Badge>
        ) : (
          <span className={cn("text-ui-fg/55", desktop ? "text-[13px]" : "text-sm")}>
            {formatNewsDisplayDate(toAppDateKey(survey.published_at))}
          </span>
        )}
      </div>
      <h3 className={cn("font-bold text-ui-fg", desktop ? "text-[17px] leading-[21px]" : "text-lg leading-[23px]")}>{survey.title}</h3>
      {description ? (
        <p className={cn("whitespace-pre-line text-ui-fg/55", desktop ? "text-[13.5px] leading-5" : "text-[14.5px] leading-[21px]")}>{description}</p>
      ) : null}
    </div>
  );

  if (desktop) {
    return (
      <article
        className={cn("flex flex-col gap-2.5 rounded-xl border border-ui-fg/10 bg-ui-raised p-5", completed && "opacity-70")}
      >
        {body}
        <Meta survey={survey} layout={layout} />
        {completed ? (
          <p className="pt-1.5 text-[13px] text-ui-fg/60">Ответы отправлены</p>
        ) : (
          <Button asChild variant="accent" size="md" className="mt-1.5 w-fit rounded-[10px] px-4 text-sm">
            <Link href={surveyHref(survey.id)}>Пройти опрос</Link>
          </Button>
        )}
      </article>
    );
  }

  const footer = (
    <div className="flex items-center gap-4 border-t border-ui-fg/10 px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <Meta survey={survey} layout={layout} />
      </div>
      {completed ? null : <ChevronRight className="size-5 shrink-0 text-ui-fg/55" aria-hidden />}
    </div>
  );
  const cardClass = "block overflow-hidden rounded-[18px] border border-ui-fg/10 bg-ui-surface text-left";

  return completed ? (
    <article className={cn(cardClass, "opacity-70")}>
      {body}
      {footer}
    </article>
  ) : (
    <Link
      href={surveyHref(survey.id)}
      className={cn(cardClass, "transition-colors hover:bg-ui-fg/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70")}
    >
      {body}
      {footer}
    </Link>
  );
}
