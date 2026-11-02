"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NEWS_SURVEYS_HREF } from "@/lib/surveys/routes";
import { DESKTOP_ACTION, SurveyDesktopScreen, SurveyMobileScreen, type SurveyLayout } from "./survey-frame";

type SurveyResultProps = {
  layout: SurveyLayout;
  icon: ReactNode;
  tile: "neutral" | "success" | "danger";
  title: string;
  description?: ReactNode;
  /**
   * Built for the layout: on Mobile the bottom bar, the main action on top; on Desktop a row under
   * the text, the main action last.
   */
  actions: ReactNode;
  /** An error: screen readers announce it at once. */
  alert?: boolean;
};

/**
 * Where a survey ends (Figma «Ответы отправлены», «ошибка отправки») or why it cannot be taken:
 * the large result on the screen, the actions under it.
 */
export function SurveyResult({ layout, icon, tile, title, description, actions, alert = false }: SurveyResultProps) {
  const desktop = layout === "desktop";
  const result = (
    <div role={alert ? "alert" : "status"}>
      <EmptyState
        size="lg"
        tile={tile}
        icon={icon}
        title={title}
        description={description}
        action={desktop ? <div className="flex flex-wrap justify-center gap-2.5 pt-1">{actions}</div> : undefined}
        className={desktop ? "py-6" : undefined}
      />
    </div>
  );

  if (desktop) return <SurveyDesktopScreen narrow>{result}</SurveyDesktopScreen>;
  return (
    <SurveyMobileScreen centered actions={actions} actionsLayout="column">
      {result}
    </SurveyMobileScreen>
  );
}

/** «Ответы отправлены» (Figma 54-1638 / 54-3655): the end of the survey, for the client and in the preview. */
export function SurveySentResult({ layout, actions }: { layout: SurveyLayout; actions: ReactNode }) {
  return (
    <SurveyResult
      layout={layout}
      tile="success"
      icon={<Check />}
      title="Ответы отправлены"
      description="Ваши ответы помогут сделать Workflow удобнее"
      actions={actions}
    />
  );
}

/** «К опросам»: the «Опросы» tab of «Все новости» instead of the survey left behind. */
export function ToSurveysButton({ layout }: { layout: SurveyLayout }) {
  const desktop = layout === "desktop";
  return (
    <Button asChild variant="accent" size={desktop ? "md" : "block"} className={desktop ? DESKTOP_ACTION : undefined}>
      <Link href={NEWS_SURVEYS_HREF} replace>
        К опросам
      </Link>
    </Button>
  );
}
