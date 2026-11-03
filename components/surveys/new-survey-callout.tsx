"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bannerSummary, durationShortLabel } from "@/lib/surveys/format";
import { surveyHref } from "@/lib/surveys/routes";
import type { ClientSurvey } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";

type NewSurveyCalloutProps = {
  /** The newest open survey the client has not taken (latestAvailableSurvey). */
  survey: ClientSurvey;
  /**
   * `card` — the card on the Mobile home under «Все новости» (Figma «Главная: карточка «Новый
   * опрос»»); `banner` — the row above the news on Desktop (Figma «Клиент Desktop Новости»).
   */
  layout: "card" | "banner";
  className?: string;
};

const SURFACE = "flex items-center border border-ui-accent/30 bg-ui-accent-soft";
/** 16/19 and 13.5/16 as in Figma: the two lines stay within the height of the icon tile. */
const TITLE = "text-base font-bold leading-[19px] text-ui-fg";
const SUBTITLE = "text-[13.5px] leading-4 text-ui-fg/70";

function SurveyIcon() {
  return (
    <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-4pt-md bg-ui-accent text-ui-fg">
      <ClipboardList className="size-6" />
    </span>
  );
}

/** «Новый опрос»: leads the client to the newest survey they have not taken. */
export function NewSurveyCallout({ survey, layout, className }: NewSurveyCalloutProps) {
  if (layout === "banner") {
    return (
      <section aria-label="Новый опрос" className={cn(SURFACE, "gap-4 rounded-4pt-md px-5 py-4", className)}>
        <SurveyIcon />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className={cn(TITLE, "truncate")}>Новый опрос: {survey.title}</p>
          <p className={cn(SUBTITLE, "truncate")}>{bannerSummary(survey)}</p>
        </div>
        <Button asChild variant="accent" className="h-10 shrink-0 rounded-[10px] px-4 text-sm">
          <Link href={surveyHref(survey.id)}>Пройти</Link>
        </Button>
      </section>
    );
  }

  return (
    <Link
      href={surveyHref(survey.id)}
      className={cn(
        SURFACE,
        "gap-3 rounded-[18px] p-3.5 transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
        className,
      )}
    >
      <SurveyIcon />
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className={TITLE}>Новый опрос</span>
        {/* On a narrow phone the title is cut, the duration stays: «Удобство раздела «За… · 2 мин». */}
        <span className={cn(SUBTITLE, "flex min-w-0")}>
          <span className="truncate">{survey.title}</span>
          {survey.estimated_minutes == null ? null : (
            <span className="shrink-0 whitespace-pre"> · {durationShortLabel(survey.estimated_minutes)}</span>
          )}
        </span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-ui-accent" />
    </Link>
  );
}
