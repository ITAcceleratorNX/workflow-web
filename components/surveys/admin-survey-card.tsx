"use client";

import Link from "next/link";
import { useId } from "react";
import { ChevronRight, Eye, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IconActions } from "@/components/ui/icon-actions";
import { formatNewsDisplayDate } from "@/constants/news-filters";
import { formatTimeOnly, toAppDateKey } from "@/lib/dateTimeUtils";
import { adminResponsesLabel, adminStatusLabel, adminSurveyMeta } from "@/lib/surveys/format";
import { adminSurveyEditHref, adminSurveyPreviewHref, adminSurveyResultsHref } from "@/lib/surveys/routes";
import type { AdminSurvey } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";

type AdminSurveyCardProps = {
  survey: AdminSurvey;
  /** Today in the time zone of the app, YYYY-MM-DD: «сегодня». */
  todayKey: string;
  layout: "mobile" | "desktop";
};

/** «сегодня» or «20 окт 2026»; with the time — «сегодня, 10:40». */
function momentLabel(iso: string, todayKey: string, withTime: boolean): string {
  const dateKey = toAppDateKey(iso);
  const day = dateKey === todayKey ? "сегодня" : formatNewsDisplayDate(dateKey);
  return withTime ? `${day}, ${formatTimeOnly(iso)}` : day;
}

/**
 * A survey in «Управление новостями» → «Опросы» (Figma «Список после публикации»): its status and
 * when it changed; a draft opens in the constructor or the preview, a published or closed survey
 * shows its answers under the card.
 */
export function AdminSurveyCard({ survey, todayKey, layout }: AdminSurveyCardProps) {
  const titleId = useId();
  const desktop = layout === "desktop";
  const draft = survey.status === "draft";
  // A draft on Desktop says the time it was changed: «изменён сегодня, 10:40».
  const meta = adminSurveyMeta(survey, (iso) => momentLabel(iso, todayKey, desktop && draft));

  const status = (
    <Badge variant={survey.status === "published" ? "success" : "neutral"}>{adminStatusLabel(survey.status)}</Badge>
  );
  const actions = draft ? (
    <IconActions
      actions={[
        { label: "Изменить", icon: <PenLine aria-hidden />, href: adminSurveyEditHref(survey.id) },
        { label: "Предпросмотр", icon: <Eye aria-hidden />, href: adminSurveyPreviewHref(survey.id) },
      ]}
    />
  ) : null;
  const title = (
    <h3 id={titleId} className={cn("font-bold text-ui-fg", desktop ? "text-[17px] leading-[21px]" : "text-lg leading-[23px]")}>
      {survey.title}
    </h3>
  );
  const description = survey.description ? (
    <p className={cn("whitespace-pre-line", desktop ? "text-sm leading-5 text-ui-fg/60" : "text-[14.5px] leading-[21px] text-ui-fg/55")}>
      {survey.description}
    </p>
  ) : null;
  const metaLine = <p className={cn("leading-4 text-ui-fg/60", desktop ? "text-[13px]" : "text-[13.5px]")}>{meta}</p>;

  const card = desktop ? (
    <div className="flex items-start gap-5 rounded-4pt-md border border-ui-fg/10 bg-ui-raised px-5 py-[18px]">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="accent">Опрос</Badge>
          {metaLine}
        </div>
        {title}
        {description}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2.5">
        {status}
        {actions}
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-2.5 rounded-[18px] border border-ui-fg/10 bg-ui-surface p-3.5">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="accent">Опрос</Badge>
        {status}
      </div>
      {title}
      {description}
      <div className="flex min-h-11 items-center justify-between gap-2.5">
        {metaLine}
        {actions}
      </div>
    </div>
  );

  return (
    <article aria-labelledby={titleId} className={cn("flex flex-col", desktop ? "gap-[18px]" : "gap-3.5")}>
      {card}
      {draft ? null : (
        <div
          className={cn(
            "flex items-center justify-between gap-3 border border-ui-fg/10",
            desktop ? "rounded-4pt-md bg-ui-raised px-4 py-3" : "rounded-[18px] bg-ui-surface px-4 py-3.5",
          )}
        >
          <span className={desktop ? "text-[14.5px] text-ui-fg/60" : "text-base text-ui-fg/55"}>
            {adminResponsesLabel(survey.responses_count)}
          </span>
          <Link
            href={adminSurveyResultsHref(survey.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-4pt-xs text-ui-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70",
              desktop ? "text-sm font-semibold" : "text-[15px]",
            )}
          >
            Результаты
            <ChevronRight aria-hidden className={desktop ? "size-4" : "size-[18px]"} />
          </Link>
        </div>
      )}
    </article>
  );
}
