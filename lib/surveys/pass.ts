import { isAnswered, type AnswerDraft, type AnswersDraft } from "./answers";
import type { SurveyQuestion } from "./types";

/**
 * Прохождение опроса (Figma «Вступление» → «Вопрос N из M» → «Ответы отправлены» или «Не удалось
 * отправить ответы»): экран, ответы и отправка. Ответ на каждый вопрос обязателен — «Далее» без него
 * не ведёт дальше. Пока ответы уходят на сервер, они не меняются. Хук useSurveyPass держит это
 * состояние и отправляет ответы.
 */

export type PassScreen = "intro" | "question" | "sent" | "failed";

export interface PassState {
  screen: PassScreen;
  /** Вопрос на экране «Вопрос N из M», с нуля. */
  index: number;
  answers: AnswersDraft;
  /** Ответы уходят на сервер. */
  sending: boolean;
}

export type PassAction =
  | { type: "start" }
  | { type: "answer"; questionId: number; answer: AnswerDraft }
  | { type: "next" }
  | { type: "back" }
  | { type: "send" }
  | { type: "sent" }
  | { type: "failed" }
  /** Опрос больше не принимает ответы (завершён, пройден, недоступен): экран покажет его состояние. */
  | { type: "settled" }
  /** «Вернуться к вопросам» после ошибки отправки — к последнему вопросу. */
  | { type: "review" };

export const INITIAL_PASS: PassState = Object.freeze({ screen: "intro", index: 0, answers: {}, sending: false });

export function passReducer(questions: readonly SurveyQuestion[], state: PassState, action: PassAction): PassState {
  if (state.sending && action.type !== "sent" && action.type !== "failed" && action.type !== "settled") return state;

  switch (action.type) {
    case "start":
      return state.screen === "intro" && questions.length ? { ...state, screen: "question", index: 0 } : state;
    case "answer":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.answer } };
    case "next": {
      const question = questions[state.index];
      const last = state.index >= questions.length - 1;
      if (state.screen !== "question" || last || !isAnswered(question, state.answers[question.id])) return state;
      return { ...state, index: state.index + 1 };
    }
    case "back":
      return state.screen === "question" && state.index > 0 ? { ...state, index: state.index - 1 } : state;
    case "send":
      return { ...state, sending: true };
    case "sent":
      return { ...state, screen: "sent", sending: false };
    case "failed":
      return { ...state, screen: "failed", sending: false };
    case "settled":
      return { ...state, sending: false };
    case "review":
      return state.screen === "failed" ? { ...state, screen: "question", index: questions.length - 1 } : state;
  }
}
