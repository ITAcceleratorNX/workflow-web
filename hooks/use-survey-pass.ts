"use client";

import { useCallback, useReducer, useRef } from "react";
import { newRequestId } from "@/lib/request-id";
import { surveysApi } from "@/lib/surveys-api";
import { submissionAnswers, submitOutcome, type AnswerDraft } from "@/lib/surveys/answers";
import { INITIAL_PASS, passReducer, type PassAction, type PassState } from "@/lib/surveys/pass";
import type { SurveyQuestion, SurveyToTake } from "@/lib/surveys/types";

/** Шаги прохождения (lib/surveys/pass.ts): экран, ответы, «Далее», «Назад». */
function usePassSteps(questions: SurveyQuestion[]) {
  const [state, dispatch] = useReducer(
    (current: PassState, action: PassAction) => passReducer(questions, current, action),
    INITIAL_PASS,
  );
  const answer = useCallback(
    (questionId: number, value: AnswerDraft) => dispatch({ type: "answer", questionId, answer: value }),
    [],
  );
  const steps = {
    ...state,
    question: questions[state.index],
    total: questions.length,
    start: () => dispatch({ type: "start" }),
    next: () => dispatch({ type: "next" }),
    back: () => dispatch({ type: "back" }),
    review: () => dispatch({ type: "review" }),
    answer,
  };
  return { state, dispatch, steps };
}

/**
 * Прохождение опроса клиентом (lib/surveys/pass.ts) и отправка ответов. Все попытки одного
 * прохождения идут с одним `client_request_id`: если ответ сервера потерялся, «Повторить отправку»
 * получит прежний успех, а не «уже пройден». `onSettled` — опрос больше не принимает ответы
 * (завершён, пройден с другого устройства, недоступен): экран перечитывает его состояние.
 */
export function useSurveyPass(survey: SurveyToTake, onSettled: () => void) {
  const { id: surveyId, questions } = survey;
  const { state, dispatch, steps } = usePassSteps(questions);
  const requestId = useRef<string | null>(null);
  const inFlight = useRef(false);

  const send = useCallback(async () => {
    const answers = submissionAnswers(questions, state.answers);
    if (!answers || inFlight.current) return;
    inFlight.current = true;
    requestId.current ??= newRequestId();
    dispatch({ type: "send" });
    const result = await surveysApi.submitAnswers(surveyId, { client_request_id: requestId.current, answers });
    inFlight.current = false;
    const outcome = submitOutcome(result);
    if (outcome === "completed") dispatch({ type: "sent" });
    else if (outcome === "failed") dispatch({ type: "failed" });
    else {
      dispatch({ type: "settled" });
      onSettled();
    }
  }, [questions, state.answers, surveyId, onSettled, dispatch]);

  return { ...steps, send };
}

/**
 * Предпросмотр Администратора (шаг 14): те же шаги, что у клиента, а «Отправить» ничего не
 * отправляет — сразу «Ответы отправлены».
 */
export function usePreviewPass(survey: SurveyToTake) {
  const { dispatch, steps } = usePassSteps(survey.questions);
  const send = useCallback(async () => dispatch({ type: "sent" }), [dispatch]);
  return { ...steps, send };
}

export type UseSurveyPassResult = ReturnType<typeof useSurveyPass>;
