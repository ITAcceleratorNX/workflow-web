"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ClipboardX, Loader2, Lock, RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useClientSurvey } from "@/hooks/use-client-survey";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useSurveyPass } from "@/hooks/use-survey-pass";
import { getTodayAppDateISO, toAppDateKey } from "@/lib/dateTimeUtils";
import { completedLabel } from "@/lib/surveys/format";
import { NEWS_SURVEYS_HREF } from "@/lib/surveys/routes";
import type { ClientSurveyDetail } from "@/lib/surveys/types";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  DESKTOP_ACTION,
  SurveyBackButton,
  SurveyDesktopScreen,
  SurveyMobileScreen,
  SurveyRetryButton,
  type SurveyLayout,
} from "./survey-frame";
import { SurveyResult, SurveySentResult, ToSurveysButton } from "./survey-result";
import { SurveyIntro, SurveyQuestionStep, useStepHeading } from "./survey-steps";

type PassProps = {
  survey: ClientSurveyDetail;
  layout: SurveyLayout;
  onExit: () => void;
  onSettled: () => void;
};

/** Taking an open survey: «Вступление» → questions → «Ответы отправлены» or the error of sending. */
function SurveyPass({ survey, layout, onExit, onSettled }: PassProps) {
  const pass = useSurveyPass(survey, onSettled);
  const heading = useStepHeading(`${pass.screen}:${pass.index}`);

  if (pass.screen === "intro") {
    return <SurveyIntro survey={survey} layout={layout} headingRef={heading} onExit={onExit} onStart={pass.start} />;
  }
  if (pass.screen === "question") {
    return <SurveyQuestionStep survey={survey} layout={layout} headingRef={heading} onExit={onExit} pass={pass} />;
  }
  if (pass.screen === "sent") return <SurveySentResult layout={layout} actions={<ToSurveysButton layout={layout} />} />;

  const desktop = layout === "desktop";
  const action = { size: desktop ? ("md" as const) : ("block" as const), className: desktop ? DESKTOP_ACTION : undefined };
  const retry = (
    <Button variant="accent" {...action} disabled={pass.sending} onClick={() => void pass.send()}>
      {pass.sending ? <Loader2 aria-hidden className="animate-spin" /> : <RotateCw aria-hidden />}
      Повторить отправку
    </Button>
  );
  const review = (
    <Button variant="neutral-outline" {...action} disabled={pass.sending} onClick={pass.review}>
      Вернуться к вопросам
    </Button>
  );
  return (
    <SurveyResult
      layout={layout}
      alert
      tile="danger"
      icon={<TriangleAlert />}
      title="Не удалось отправить ответы"
      description="Проверьте подключение к интернету и попробуйте ещё раз. Ответы остались заполненными."
      actions={desktop ? <>{review}{retry}</> : <>{retry}{review}</>}
    />
  );
}

/** A survey on its way: the shape of its intro. */
export function SurveySkeleton({ layout }: { layout: SurveyLayout }) {
  if (layout === "desktop") {
    return (
      <div role="status" aria-label="Загружаем опрос" className="flex flex-col gap-[18px] px-10 pb-12 pt-8">
        <div className="h-[18px]" />
        <div className="mx-auto h-[365px] w-full max-w-[720px] animate-pulse rounded-4pt-lg bg-ui-raised" />
      </div>
    );
  }
  return (
    <div
      role="status"
      aria-label="Загружаем опрос"
      className="flex min-h-[100dvh] flex-col gap-3.5 bg-ui-canvas px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <div className="h-11" />
      <div className="h-[30px] w-[66px] animate-pulse rounded-full bg-ui-surface" />
      <div className="h-[62px] w-3/4 animate-pulse rounded-4pt-md bg-ui-surface" />
      <div className="h-12 animate-pulse rounded-4pt-md bg-ui-surface" />
      <div className="h-[172px] animate-pulse rounded-4pt-xl bg-ui-surface" />
    </div>
  );
}

type LoadErrorProps = { layout: SurveyLayout; error: string | null; onRetry: () => void; onExit: () => void };

/** The survey did not load: the reason and «Повторить», as at the list of surveys. */
export function SurveyLoadError({ layout, error, onRetry, onExit }: LoadErrorProps) {
  const state = (
    <div role="alert">
      <EmptyState
        icon={<AlertCircle />}
        title="Не удалось загрузить опрос"
        description={error}
        action={<SurveyRetryButton onClick={onRetry} />}
      />
    </div>
  );
  if (layout === "desktop") {
    return (
      <SurveyDesktopScreen narrow top={<SurveyBackButton layout="desktop" onClick={onExit} />}>
        <div className="py-6">{state}</div>
      </SurveyDesktopScreen>
    );
  }
  return (
    <SurveyMobileScreen>
      <SurveyBackButton layout="mobile" onClick={onExit} />
      <div className="flex flex-1 flex-col justify-center pb-24">{state}</div>
    </SurveyMobileScreen>
  );
}

/**
 * A survey of the client by its address (`/client/surveys/{id}`, also from the push «Новый опрос»):
 * the survey to take, or why it cannot be taken — completed, closed, not available.
 */
export function SurveyScreen({ surveyId }: { surveyId: number | null }) {
  const layout: SurveyLayout = useIsDesktop() ? "desktop" : "mobile";
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.isGuest);
  // Surveys are for a signed-in client: a guest has none.
  const signedIn = Boolean(token) && !isGuest;
  const { survey, loading, error, missing, reload } = useClientSurvey(surveyId, { enabled: signedIn });

  // A survey opened from a push or a link has no screen behind it: go to the surveys instead.
  const exit = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.replace(NEWS_SURVEYS_HREF);
  }, [router]);
  // «Повторить» after a loading error; after a send the survey refused, its state as it is now.
  const reloadSurvey = useCallback(() => void reload(), [reload]);

  if (!signedIn || surveyId == null || missing || (survey?.state === "available" && !survey.questions.length)) {
    return (
      <SurveyResult
        layout={layout}
        tile="neutral"
        icon={<ClipboardX />}
        title="Опрос недоступен"
        description={signedIn ? "Возможно, он предназначен для другого офиса или был удалён" : "Войдите в аккаунт, чтобы пройти опрос"}
        actions={<ToSurveysButton layout={layout} />}
      />
    );
  }

  if (!survey) {
    return error && !loading ? (
      <SurveyLoadError layout={layout} error={error} onRetry={reloadSurvey} onExit={exit} />
    ) : (
      <SurveySkeleton layout={layout} />
    );
  }

  if (survey.state === "completed") {
    return (
      <SurveyResult
        layout={layout}
        tile="success"
        icon={<Check />}
        title="Ответы отправлены"
        description={survey.completed_at ? completedLabel(toAppDateKey(survey.completed_at), getTodayAppDateISO()) : undefined}
        actions={<ToSurveysButton layout={layout} />}
      />
    );
  }

  if (survey.state === "closed") {
    return (
      <SurveyResult
        layout={layout}
        tile="neutral"
        icon={<Lock />}
        title="Опрос завершён"
        description="Ответы больше не принимаются"
        actions={<ToSurveysButton layout={layout} />}
      />
    );
  }

  return <SurveyPass survey={survey} layout={layout} onExit={exit} onSettled={reloadSurvey} />;
}
