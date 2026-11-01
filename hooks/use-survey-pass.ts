"use client";

import { useCallback, useReducer, useRef } from "react";
import { newRequestId } from "@/lib/request-id";
import { surveysApi } from "@/lib/surveys-api";
import { submissionAnswers, submitOutcome, type AnswerDraft } from "@/lib/surveys/answers";
import { INITIAL_PASS, passReducer, type PassAction, type PassState } from "@/lib/surveys/pass";
import type { ClientSurveyDetail } from "@/lib/surveys/types";

/**
 * Прохождение опроса клиентом (lib/surveys/pass.ts) и отправка ответов. Все попытки одного
 * прохождения идут с одним `client_request_id`: если ответ сервера потерялся, «Повторить отправку»
 * получит прежний успех, а не «уже пройден». `onSettled` — опрос больше не принимает ответы
 * (завершён, пройден с другого устройства, недоступен): экран перечитывает его состояние.
 */
export function useSurveyPass(survey: ClientSurveyDetail, onSettled: () => void) {
  const { id: surveyId, questions } = survey;
  const [state, dispatch] = useReducer(
    (current: PassState, action: PassAction) => passReducer(questions, current, action),
    INITIAL_PASS,
  );
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
  }, [questions, state.answers, surveyId, onSettled]);

  const answer = useCallback(
    (questionId: number, value: AnswerDraft) => dispatch({ type: "answer", questionId, answer: value }),
    [],
  );

  return {
    ...state,
    question: questions[state.index],
    total: questions.length,
    start: () => dispatch({ type: "start" }),
    next: () => dispatch({ type: "next" }),
    back: () => dispatch({ type: "back" }),
    review: () => dispatch({ type: "review" }),
    answer,
    send,
  };
}

export type UseSurveyPassResult = ReturnType<typeof useSurveyPass>;
