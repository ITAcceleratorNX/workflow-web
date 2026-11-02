"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { InfoBanner } from "@/components/ui/info-banner";
import { useAdminSurvey } from "@/hooks/use-admin-survey";
import { useIsDesktop } from "@/hooks/use-media-query";
import { usePreviewPass } from "@/hooks/use-survey-pass";
import { previewFromSurvey } from "@/lib/surveys/preview";
import { ADMIN_SURVEYS_HREF, adminSurveyEditHref } from "@/lib/surveys/routes";
import type { SurveyToTake } from "@/lib/surveys/types";
import { DESKTOP_ACTION, SurveyPreviewFrame, type SurveyLayout } from "./survey-frame";
import { SurveyResult, SurveySentResult } from "./survey-result";
import { SurveyLoadError, SurveySkeleton } from "./survey-screen";
import { SurveyIntro, SurveyQuestionStep, useStepHeading } from "./survey-steps";

type SurveyPreviewProps = {
  survey: SurveyToTake;
  layout: SurveyLayout;
  onClose: () => void;
  /** A saved draft without questions: «Изменить» leads to the constructor. */
  editHref?: string;
};

/**
 * «Предпросмотр — так опрос увидит клиент» (Figma 54-2478 / 54-5072): the screens of the client from
 * the intro to «Ответы отправлены»; the answers go nowhere.
 */
export function SurveyPreview({ survey, layout, onClose, editHref }: SurveyPreviewProps) {
  const pass = usePreviewPass(survey);
  const heading = useStepHeading(`${pass.screen}:${pass.index}`);
  const desktop = layout === "desktop";
  const action = { size: desktop ? ("md" as const) : ("block" as const), className: desktop ? DESKTOP_ACTION : undefined };

  let screen;
  if (!survey.questions.length) {
    screen = (
      <SurveyResult
        layout={layout}
        tile="neutral"
        icon={<ListChecks />}
        title="Вопросов пока нет"
        description="Добавьте хотя бы один вопрос, чтобы опубликовать опрос"
        actions={
          editHref ? (
            <Button asChild variant="accent" {...action}>
              <Link href={editHref}>Изменить</Link>
            </Button>
          ) : null
        }
      />
    );
  } else if (pass.screen === "intro") {
    screen = <SurveyIntro survey={survey} layout={layout} headingRef={heading} onExit={onClose} onStart={pass.start} />;
  } else if (pass.screen === "question") {
    screen = <SurveyQuestionStep survey={survey} layout={layout} headingRef={heading} onExit={onClose} pass={pass} />;
  } else {
    screen = (
      <SurveySentResult
        layout={layout}
        actions={
          <Button variant="accent" {...action} onClick={onClose}>
            Закрыть
          </Button>
        }
      />
    );
  }

  return (
    <SurveyPreviewFrame
      banner={
        <InfoBanner variant={desktop ? "strip" : "card"} icon={<Eye />} action={{ label: "Закрыть", onClick: onClose }}>
          Предпросмотр — так опрос увидит клиент. Ответы не сохраняются.
        </InfoBanner>
      }
    >
      {screen}
    </SurveyPreviewFrame>
  );
}

/** Desktop: the preview of the constructor is a window over it (Figma 54-5072); Esc and a click outside close it. */
export function SurveyPreviewDialog({ survey, onClose }: { survey: SurveyToTake | null; onClose: () => void }) {
  return (
    <Dialog open={survey != null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/60"
        aria-describedby={undefined}
        // Steps differ in height: the window stays at the top instead of jumping around the middle.
        className="top-[72px] block max-h-[calc(100dvh-96px)] w-full max-w-[720px] translate-y-0 overflow-y-auto rounded-4pt-lg border-0 bg-transparent p-0 shadow-2xl sm:rounded-4pt-lg"
      >
        <DialogTitle className="sr-only">Предпросмотр опроса</DialogTitle>
        {survey ? <SurveyPreview survey={survey} layout="desktop" onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

/** «Предпросмотр» of a saved survey from the list (`/surveys/{id}/preview`): «Закрыть» returns there. */
export function AdminSurveyPreviewScreen({ surveyId }: { surveyId: number }) {
  const layout: SurveyLayout = useIsDesktop() ? "desktop" : "mobile";
  const router = useRouter();
  const { survey, loading, error, reload } = useAdminSurvey(surveyId);
  const preview = useMemo(() => (survey ? previewFromSurvey(survey) : null), [survey]);

  const close = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.replace(ADMIN_SURVEYS_HREF);
  }, [router]);

  let content;
  if (preview && survey) {
    content = (
      <SurveyPreview
        survey={preview}
        layout={layout}
        onClose={close}
        editHref={survey.status === "draft" ? adminSurveyEditHref(survey.id) : undefined}
      />
    );
  } else if (error && !loading) {
    content = <SurveyLoadError layout={layout} error={error} onRetry={() => void reload()} onExit={close} />;
  } else {
    content = <SurveySkeleton layout={layout} />;
  }

  if (layout === "mobile" || !preview) return content;
  return (
    <div className="flex justify-center px-10 pb-12 pt-8">
      <div className="w-full max-w-[720px]">{content}</div>
    </div>
  );
}
