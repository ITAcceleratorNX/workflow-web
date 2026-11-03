import type { NamedAnswer, NamedResponse, SurveyQuestionResult, SurveyResults } from "./types";

/**
 * Результаты опроса у Администратора (docs/surveys-plan.md, шаг 15): числа считает сервер, здесь —
 * только порядок, в котором их показывают экраны.
 */

/** Ответов ещё нет: вместо итогов — «Пока нет ответов». */
export const hasNoResponses = (results: SurveyResults) => results.survey.responses_count === 0;

type RatingResult = Extract<SurveyQuestionResult, { type: "rating" }>;

/** Оценки сверху вниз — 5 … 1, как в макете; сервер отдаёт их по возрастанию. */
export const ratingRows = (question: RatingResult) => [...question.distribution].reverse();

/** Ответы человека по порядку вопросов опроса; вопрос без ответа — с null. */
export function answersByQuestion<Q extends { id: number }>(
  questions: readonly Q[],
  response: NamedResponse,
): { question: Q; answer: NamedAnswer | null }[] {
  const byQuestion = new Map(response.answers.map((answer) => [answer.question_id, answer]));
  return questions.map((question) => ({ question, answer: byQuestion.get(question.id) ?? null }));
}
