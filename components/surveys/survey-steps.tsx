"use client";

import type { ReactNode, Ref } from "react";
import { ChevronLeft, ChevronRight, Clock, Info, List, Loader2, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepProgress } from "@/components/ui/step-progress";
import type { UseSurveyPassResult } from "@/hooks/use-survey-pass";
import { isAnswered } from "@/lib/surveys/answers";
import { durationLabel, questionCounter, questionHint } from "@/lib/surveys/format";
import type { ClientSurveyDetail } from "@/lib/surveys/types";
import { cn } from "@/lib/utils";
import { SurveyAnswerField } from "./survey-answer-field";
import { DESKTOP_ACTION, SurveyBackButton, SurveyDesktopScreen, SurveyMobileScreen, type SurveyLayout } from "./survey-frame";

type StepProps = {
  survey: ClientSurveyDetail;
  layout: SurveyLayout;
  /** The title of the step: the screen focuses it when the step changes. */
  headingRef: Ref<HTMLHeadingElement>;
  onExit: () => void;
};

/** A fact of the intro on Desktop: «Вопросов 5», «Время ~2 минуты», «Правильных ответов нет». */
function FactTile({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex min-h-[97px] flex-1 flex-col gap-1.5 rounded-4pt-md bg-ui-surface p-3.5">
      <span className="flex items-center gap-1.5 text-[13px] leading-4 text-ui-fg/60">
        <span aria-hidden className="text-ui-accent [&_svg]:size-5">{icon}</span>
        {label}
      </span>
      <span className="text-lg font-bold leading-[22px]">{value}</span>
    </div>
  );
}

/** A fact of the intro on Mobile: a row of the card. */
function FactRow({ icon, label, value }: { icon: ReactNode; label: string; value?: ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-3.5">
      <span aria-hidden className="shrink-0 text-ui-accent [&_svg]:size-5">{icon}</span>
      <span className="flex-1 text-[15px] leading-[18px]">{label}</span>
      {value != null ? <span className="text-base font-bold leading-[19px]">{value}</span> : null}
    </li>
  );
}

/** «Вступление»: what the survey is about, how long it takes, «Начать». */
export function SurveyIntro({ survey, layout, headingRef, onExit, onStart }: StepProps & { onStart: () => void }) {
  const minutes = survey.estimated_minutes;
  const description = survey.description ? (
    <p className="whitespace-pre-line text-base leading-6 text-ui-fg/80">{survey.description}</p>
  ) : null;

  if (layout === "desktop") {
    return (
      <SurveyDesktopScreen top={<SurveyBackButton layout="desktop" onClick={onExit} />}>
        <Badge variant="accent" className="w-fit">Опрос</Badge>
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-bold leading-[34px] outline-none">
          {survey.title}
        </h1>
        {description}
        <div className="flex gap-3">
          <FactTile icon={<List />} label="Вопросов" value={survey.questions_count} />
          {minutes != null ? <FactTile icon={<Clock />} label="Время" value={durationLabel(minutes)} /> : null}
          <FactTile icon={<Info />} label="Правильных ответов" value="нет" />
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="accent" size="md" className={DESKTOP_ACTION} onClick={onStart}>
            Начать опрос
          </Button>
        </div>
      </SurveyDesktopScreen>
    );
  }

  return (
    <SurveyMobileScreen
      actions={
        <Button variant="accent" size="block" onClick={onStart}>
          Начать
        </Button>
      }
    >
      <SurveyBackButton layout="mobile" onClick={onExit} />
      <Badge variant="accent" className="w-fit">Опрос</Badge>
      <h1 ref={headingRef} tabIndex={-1} className="text-[26px] font-bold leading-[31px] outline-none">
        {survey.title}
      </h1>
      {description}
      <ul className="flex flex-col divide-y divide-ui-fg/10 rounded-4pt-xl bg-ui-surface px-4 py-1">
        <FactRow icon={<List />} label="Вопросов" value={survey.questions_count} />
        {minutes != null ? <FactRow icon={<Clock />} label="Время" value={durationLabel(minutes)} /> : null}
        <FactRow icon={<Info />} label="Правильных ответов нет — важно ваше мнение" />
      </ul>
    </SurveyMobileScreen>
  );
}

/** «Вопрос N из M»: the question, its answer, «Назад» and «Далее» or «Отправить» on the last one. */
export function SurveyQuestionStep({ survey, layout, headingRef, onExit, pass }: StepProps & { pass: UseSurveyPassResult }) {
  const { question, index, total, sending } = pass;
  const answer = pass.answers[question.id];
  const desktop = layout === "desktop";
  const counter = questionCounter(index, total);
  const progressLabel = `Вопрос ${counter}`;
  const action = { size: desktop ? ("md" as const) : ("block" as const), className: desktop ? DESKTOP_ACTION : undefined };

  const back = (
    <Button variant="neutral-outline" {...action} disabled={index === 0 || sending} onClick={pass.back}>
      <ChevronLeft aria-hidden />
      Назад
    </Button>
  );
  const forward = index === total - 1 ? (
    <Button variant="accent" {...action} disabled={!isAnswered(question, answer) || sending} onClick={() => void pass.send()}>
      Отправить
      {sending ? <Loader2 aria-hidden className="animate-spin" /> : <Send aria-hidden />}
    </Button>
  ) : (
    <Button variant="accent" {...action} disabled={!isAnswered(question, answer)} onClick={pass.next}>
      Далее
      <ChevronRight aria-hidden />
    </Button>
  );

  const body = (
    <>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className={cn("text-2xl font-bold outline-none", desktop ? "pt-3 leading-[31px]" : "leading-[30px]")}
      >
        {question.text}
      </h1>
      <p className={cn("text-sm", desktop ? "text-ui-fg/60" : "text-ui-fg/55")}>{questionHint(question)}</p>
      <div className={desktop ? undefined : "pt-1.5"}>
        <SurveyAnswerField
          question={question}
          answer={answer}
          onAnswer={(value) => pass.answer(question.id, value)}
          layout={layout}
        />
      </div>
    </>
  );

  if (desktop) {
    return (
      <SurveyDesktopScreen>
        <div className="flex items-center justify-between gap-4 text-sm text-ui-fg/60">
          <p className="min-w-0 truncate">{survey.title}</p>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-4pt-xs transition-colors hover:text-ui-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
          >
            <X aria-hidden className="size-4" />
            Выйти
          </button>
        </div>
        <div className="flex items-center gap-3">
          <StepProgress total={total} current={index + 1} label={progressLabel} surface="raised" className="flex-1" />
          <span aria-hidden className="text-sm font-semibold">{counter}</span>
        </div>
        {body}
        <div className="mt-2 flex justify-between gap-3 border-t border-ui-fg/10 pt-[18px]">
          {back}
          {forward}
        </div>
      </SurveyDesktopScreen>
    );
  }

  return (
    <SurveyMobileScreen
      actions={
        <>
          {back}
          {forward}
        </>
      }
    >
      <div className="flex h-11 items-center justify-between">
        <button
          type="button"
          aria-label="Выйти"
          onClick={onExit}
          className="flex size-11 items-center rounded-4pt-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg/70"
        >
          <X aria-hidden className="size-6" />
        </button>
        <p className="text-[15px] font-semibold leading-[18px]">{progressLabel}</p>
        <span aria-hidden className="size-11" />
      </div>
      <StepProgress total={total} current={index + 1} label={progressLabel} />
      <p className="pt-2.5 text-[13px] leading-4 text-ui-fg/55">{survey.title}</p>
      {body}
    </SurveyMobileScreen>
  );
}
