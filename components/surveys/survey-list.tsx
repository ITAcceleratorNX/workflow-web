"use client";

import { AlertCircle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { UseClientSurveysResult } from "@/hooks/use-client-surveys";
import { getTodayAppDateISO } from "@/lib/dateTimeUtils";
import { availableSurveys, completedSurveys } from "@/lib/surveys/list";
import type { ClientSurvey } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";
import { SurveyCard } from "./survey-card";

type SurveyListProps = Pick<UseClientSurveysResult, "surveys" | "loading" | "error" | "reload"> & {
  layout: "mobile" | "desktop";
};

function Section({ title, surveys, todayKey }: { title: string; surveys: ClientSurvey[]; todayKey: string }) {
  if (!surveys.length) return null;
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="pt-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-ui-fg/55">{title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {surveys.map((survey) => (
          <SurveyCard key={survey.id} survey={survey} todayKey={todayKey} layout="desktop" />
        ))}
      </div>
    </section>
  );
}

/**
 * The «Опросы» tab of «Все новости» (Figma «Список опросов», «Состояние: нет опросов»): open
 * surveys first, then completed ones — one column on Mobile, sections of cards on Desktop.
 */
export function SurveyList({ surveys, loading, error, reload, layout }: SurveyListProps) {
  const desktop = layout === "desktop";

  if (loading && !surveys.length) {
    return (
      <div role="status" aria-label="Загружаем опросы" className={cn("grid gap-3.5", desktop && "md:grid-cols-2 xl:grid-cols-3")}>
        {[0, 1, 2].map((index) => (
          <div key={index} className={cn("animate-pulse bg-ui-surface", desktop ? "h-[235px] rounded-xl" : "h-[190px] rounded-[18px]")} />
        ))}
      </div>
    );
  }

  if (error && !surveys.length) {
    return (
      <div role="alert">
        <EmptyState
          className="pt-16"
          icon={<AlertCircle />}
          title="Не удалось загрузить опросы"
          description={error}
          action={
            <Button variant="accent-outline" className="h-10 rounded-xl px-[18px] text-[15px]" onClick={() => void reload()}>
              Повторить
            </Button>
          }
        />
      </div>
    );
  }

  if (!surveys.length) {
    return (
      <EmptyState
        className={desktop ? "pt-20" : "pt-[90px]"}
        tile="neutral"
        icon={<ClipboardList />}
        title="Сейчас нет доступных опросов"
        description={desktop ? "Когда появится новый опрос, мы покажем его здесь" : "Когда появится новый опрос, мы покажем его здесь и на главной"}
      />
    );
  }

  const todayKey = getTodayAppDateISO();
  if (desktop) {
    return (
      <div className="flex flex-col gap-[18px]">
        <Section title="Доступные опросы" surveys={availableSurveys(surveys)} todayKey={todayKey} />
        <Section title="Пройденные" surveys={completedSurveys(surveys)} todayKey={todayKey} />
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3.5">
      {surveys.map((survey) => (
        <li key={survey.id}>
          <SurveyCard survey={survey} todayKey={todayKey} layout="mobile" />
        </li>
      ))}
    </ul>
  );
}
