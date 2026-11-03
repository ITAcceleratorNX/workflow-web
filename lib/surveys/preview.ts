import { draftInput, type SurveyDraft } from "./draft";
import type { AdminSurveyDetail, SurveyQuestion, SurveyQuestionType, SurveyToTake } from "./types";

/**
 * Предпросмотр Администратора (docs/surveys-plan.md, шаг 14): опрос в том виде, в каком его проходит
 * клиент, — из формы конструктора, с несохранёнными правками, или из сохранённого опроса.
 */

/** Секунды на ответ — как у сервера (services/surveys/surveyPresentation.js, QUESTION_SECONDS). */
const QUESTION_SECONDS: Readonly<Record<SurveyQuestionType, number>> = Object.freeze({
  single_choice: 15,
  multiple_choice: 20,
  rating: 10,
  yes_no: 10,
  text: 60,
});

/** Минуты на вопросы этих типов — оценка сервера (estimateSurveyMinutes): не меньше одной; без вопросов — null. */
export function estimateMinutes(types: readonly SurveyQuestionType[]): number | null {
  if (!types.length) return null;
  const seconds = types.reduce((sum, type) => sum + QUESTION_SECONDS[type], 0);
  return Math.max(1, Math.ceil(seconds / 60));
}

/** Варианты «Да / Нет» сервер создаёт сам при сохранении: у формы их ещё нет. */
const YES_NO_OPTIONS = ["Да", "Нет"];

/**
 * Форма конструктора глазами клиента: тексты — как уйдут на сервер (без пробелов по краям, без пустых
 * вариантов); номера вопросов и вариантов — по порядку, на сервере их ещё нет.
 */
export function previewFromDraft(draft: SurveyDraft): SurveyToTake {
  const input = draftInput(draft);
  const questions = (input.questions ?? []).map((question, index): SurveyQuestion => {
    const options = "options" in question ? question.options : question.type === "yes_no" ? YES_NO_OPTIONS : [];
    const rating = question.type === "rating" ? question : null;
    return {
      id: index + 1,
      type: question.type,
      text: question.text,
      scale_min_label: rating?.scale_min_label ?? null,
      scale_max_label: rating?.scale_max_label ?? null,
      options: options.map((text, optionIndex) => ({ id: optionIndex + 1, text })),
    };
  });
  return {
    id: 0,
    title: input.title,
    description: input.description ?? null,
    questions_count: questions.length,
    estimated_minutes: estimateMinutes(questions.map((question) => question.type)),
    questions,
  };
}

/** Сохранённый опрос глазами клиента: вопросы и варианты — как их отдаст клиенту сервер. */
export const previewFromSurvey = (survey: AdminSurveyDetail): SurveyToTake => ({
  id: survey.id,
  title: survey.title,
  description: survey.description,
  questions_count: survey.questions_count,
  estimated_minutes: survey.estimated_minutes,
  questions: survey.questions.map((question) => ({
    id: question.id,
    type: question.type,
    text: question.text,
    scale_min_label: question.scale_min_label,
    scale_max_label: question.scale_max_label,
    options: question.options.map(({ id, text }) => ({ id, text })),
  })),
});
