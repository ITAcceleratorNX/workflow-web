"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { AdminWorkerManagementMobileLayout } from "@/components/admin-worker/management/admin-worker-management-mobile-layout";
import { DesktopManagementPage } from "@/components/layout/desktop-management-page";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTabs } from "@/components/ui/section-tabs";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useSurveyResults } from "@/hooks/use-survey-results";
import { getTodayAppDateISO } from "@/lib/dateTimeUtils";
import { adminStatusLabel } from "@/lib/surveys/format";
import { hasNoResponses } from "@/lib/surveys/results";
import { ADMIN_SURVEYS_HREF, adminSurveyEditHref } from "@/lib/surveys/routes";
import { cn } from "@/lib/utils";
import { SurveyRetryButton, type SurveyLayout } from "../survey-frame";
import { NamedResponses } from "./named-responses";
import { QuestionResultCard } from "./question-result-card";
import { NoResponses, ResultsSummary } from "./results-summary";
import { SurveyQuestionsView } from "./survey-questions-view";

type ResultsTab = "questions" | "results" | "answers";

/**
 * The tab lives in the address (`?tab=questions`, `?tab=answers`): a reload keeps it, a switch
 * replaces the address. «Результаты» go without it — the list of surveys links there.
 * «Ответы» exist only in a named survey.
 */
function useResultsTab(named: boolean) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const asked = searchParams.get("tab");
  const tab: ResultsTab = asked === "questions" ? "questions" : asked === "answers" && named ? "answers" : "results";
  const setTab = useCallback(
    (next: ResultsTab) => router.replace(next === "results" ? pathname : `${pathname}?tab=${next}`, { scroll: false }),
    [router, pathname],
  );
  return { tab, setTab };
}

function ResultsSkeleton({ layout }: { layout: SurveyLayout }) {
  const desktop = layout === "desktop";
  return (
    <div role="status" aria-label="Загружаем результаты" className="flex flex-col gap-4">
      <div className={cn("animate-pulse", desktop ? "h-[106px] rounded-4pt-lg bg-ui-raised" : "h-[92px] rounded-4pt-xl bg-ui-surface")} />
      <div className={cn("grid gap-4", desktop && "grid-cols-2")}>
        {[0, 1].map((index) => (
          <div key={index} className={cn("h-[260px] animate-pulse", desktop ? "rounded-4pt-lg bg-ui-raised" : "rounded-4pt-xl bg-ui-surface")} />
        ))}
      </div>
    </div>
  );
}

/**
 * A published or closed survey of the Administrator (Figma «Результаты», 54-2701 / 54-5745):
 * «Вопросы» — what was asked, «Результаты» — the summary and the results of each question,
 * «Ответы» — who answered and how, in a named survey.
 */
export function SurveyResultsScreen({ surveyId }: { surveyId: number }) {
  const layout: SurveyLayout = useIsDesktop() ? "desktop" : "mobile";
  const desktop = layout === "desktop";
  const router = useRouter();
  const { results, loading, error, reload } = useSurveyResults(surveyId);
  const survey = results?.survey ?? null;
  const named = survey != null && !survey.is_anonymous;
  const { tab, setTab } = useResultsTab(named);
  const todayKey = getTodayAppDateISO();

  // A draft has no results: its address leads to the constructor.
  useEffect(() => {
    if (survey?.status === "draft") router.replace(adminSurveyEditHref(survey.id));
  }, [survey, router]);

  const back = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.replace(ADMIN_SURVEYS_HREF);
  }, [router]);

  const badge = survey ? (
    <Badge variant={survey.status === "published" ? "success" : "neutral"}>{adminStatusLabel(survey.status)}</Badge>
  ) : null;
  const tabs = survey ? (
    <SectionTabs
      ariaLabel="Раздел опроса"
      layout={layout}
      value={tab}
      onChange={setTab}
      options={[
        { value: "questions", label: "Вопросы" },
        { value: "results", label: "Результаты" },
        ...(named ? [{ value: "answers" as const, label: "Ответы" }] : []),
      ]}
    />
  ) : null;

  let content;
  if (!results) {
    content =
      error && !loading ? (
        <div role="alert" className="py-10">
          <EmptyState
            icon={<AlertCircle />}
            title="Не удалось загрузить результаты"
            description={error}
            action={<SurveyRetryButton onClick={() => void reload()} />}
          />
        </div>
      ) : (
        <ResultsSkeleton layout={layout} />
      );
  } else if (tab === "questions") {
    content = <SurveyQuestionsView results={results} layout={layout} />;
  } else if (tab === "answers") {
    content = <NamedResponses surveyId={surveyId} questions={results.questions} layout={layout} todayKey={todayKey} />;
  } else {
    content = (
      <>
        <ResultsSummary survey={results.survey} layout={layout} todayKey={todayKey} />
        {hasNoResponses(results) ? (
          <NoResponses layout={layout} />
        ) : (
          <div className={cn("grid gap-4", desktop && "grid-cols-2")}>
            {results.questions.map((question, index) => (
              <QuestionResultCard
                key={question.id}
                question={question}
                index={index}
                layout={layout}
                // Figma: the answers of an open question take the whole width.
                className={desktop && question.type === "text" ? "col-span-2" : undefined}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  const title = survey?.title ?? "Опрос";
  if (desktop) {
    return (
      <DesktopManagementPage title={title} titleAside={badge} actions={tabs} backHref={ADMIN_SURVEYS_HREF} onBack={back}>
        <div className="flex flex-col gap-4 text-ui-fg">{content}</div>
      </DesktopManagementPage>
    );
  }
  return (
    <AdminWorkerManagementMobileLayout title={title} eyebrow={badge} backHref={ADMIN_SURVEYS_HREF} onBack={back} onRefresh={reload}>
      <div className="flex flex-col gap-3.5 text-ui-fg">
        {tabs}
        {content}
      </div>
    </AdminWorkerManagementMobileLayout>
  );
}
