"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipTabs } from "@/components/ui/chip-tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useAdminSurveys } from "@/hooks/use-admin-surveys";
import { useToast } from "@/hooks/use-toast";
import { getTodayAppDateISO } from "@/lib/dateTimeUtils";
import { surveysApi } from "@/lib/surveys-api";
import { ADMIN_SURVEY_FILTERS, adminSurveysEmpty, type AdminSurveyFilter } from "@/lib/surveys/format";
import { filterAdminSurveys } from "@/lib/surveys/list";
import { ADMIN_SURVEY_NEW_HREF } from "@/lib/surveys/routes";
import type { AdminSurvey } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";
import { AdminSurveyCard } from "./admin-survey-card";
import { SurveyRetryButton } from "./survey-frame";
import { toastCloseFailed, toastSurveyClosed } from "./survey-toasts";

const LIST_ID = "admin-surveys-list";

type AdminSurveyListProps = {
  layout: "mobile" | "desktop";
  /** Pull-to-refresh of the page reloads the surveys, as it does the news. */
  onRegisterRefresh?: (refresh: () => Promise<void>) => void;
};

/**
 * «Управление новостями» → «Опросы» (Figma «Список пуст», «Список после публикации»): the «Статус»
 * filter, «Добавить опрос» and the surveys of every status, newest first.
 */
export function AdminSurveyList({ layout, onRegisterRefresh }: AdminSurveyListProps) {
  const desktop = layout === "desktop";
  const { surveys, loading, error, reload, replace } = useAdminSurveys();
  const { toast } = useToast();
  const [filter, setFilter] = useState<AdminSurveyFilter>("all");
  // «Завершить опрос»: the survey asked about, and the request on its way.
  const [closing, setClosing] = useState<AdminSurvey | null>(null);
  const [closingBusy, setClosingBusy] = useState(false);

  useEffect(() => {
    onRegisterRefresh?.(reload);
  }, [onRegisterRefresh, reload]);

  const closeSurvey = async (survey: AdminSurvey) => {
    setClosingBusy(true);
    const result = await surveysApi.closeSurvey(survey.id);
    setClosingBusy(false);
    setClosing(null);
    if (!result.ok) {
      toastCloseFailed(toast, result.error);
      return;
    }
    replace(result.data);
    toastSurveyClosed(toast);
  };

  const shown = filterAdminSurveys(surveys, filter);
  let content;
  if (loading && !surveys.length) {
    content = (
      <div role="status" aria-label="Загружаем опросы" className={cn("flex flex-col", desktop ? "gap-[18px]" : "gap-3.5")}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn("animate-pulse", desktop ? "h-[124px] rounded-4pt-md bg-ui-raised" : "h-[182px] rounded-[18px] bg-ui-surface")}
          />
        ))}
      </div>
    );
  } else if (error && !surveys.length) {
    content = (
      <div role="alert">
        <EmptyState
          className="pt-12"
          icon={<AlertCircle />}
          title="Не удалось загрузить опросы"
          description={error}
          action={<SurveyRetryButton onClick={() => void reload()} />}
        />
      </div>
    );
  } else if (!shown.length) {
    // «Опросов пока нет» from the mockup — while there are no surveys at all, whatever the filter.
    const empty = adminSurveysEmpty(surveys.length ? filter : "all");
    content = (
      <EmptyState className="pt-10" tile="neutral" icon={<ClipboardList />} title={empty.title} description={empty.description} />
    );
  } else {
    const todayKey = getTodayAppDateISO();
    content = (
      <ul className={cn("flex flex-col", desktop ? "gap-[18px]" : "gap-3.5")}>
        {shown.map((survey) => (
          <li key={survey.id}>
            <AdminSurveyCard survey={survey} todayKey={todayKey} layout={layout} onCloseSurvey={() => setClosing(survey)} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("flex flex-col text-ui-fg", desktop ? "gap-[18px]" : "gap-3.5")}>
      <div
        className={cn(
          "flex flex-col border border-ui-fg/10",
          desktop ? "gap-2.5 rounded-4pt-md bg-ui-raised px-4 py-3.5" : "gap-3 rounded-[18px] p-3.5",
        )}
      >
        <p className={desktop ? "text-sm text-ui-fg/60" : "text-base text-ui-fg/55"}>Статус</p>
        <ChipTabs
          variant="solid"
          size={desktop ? "md" : "lg"}
          ariaLabel="Статус"
          value={filter}
          onChange={setFilter}
          tabs={ADMIN_SURVEY_FILTERS}
          controls={LIST_ID}
        />
      </div>

      <Button asChild variant="accent" size="block">
        <Link href={ADMIN_SURVEY_NEW_HREF}>
          <Plus aria-hidden />
          Добавить опрос
        </Link>
      </Button>

      <div id={LIST_ID}>{content}</div>

      <ConfirmDialog
        open={closing != null}
        onOpenChange={(open) => (open ? undefined : setClosing(null))}
        title="Завершить опрос?"
        description="Клиенты больше не смогут ответить. Ответы и результаты сохранятся."
        confirmLabel="Завершить"
        busy={closingBusy}
        onConfirm={() => {
          if (closing) void closeSurvey(closing);
        }}
      />
    </div>
  );
}
