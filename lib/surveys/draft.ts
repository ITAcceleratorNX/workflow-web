import { hasVisibleText } from "./answers";
import { DRAFT_MESSAGES } from "./format";
import type { AdminSurveyDetail, SurveyDraftInput, SurveyQuestionDraft, SurveyQuestionType } from "./types";

/**
 * Черновик опроса в конструкторе Администратора (docs/surveys-plan.md, шаг 13): поля формы, вопросы
 * и их проверка. Правила те же, что у сервера (dto/survey.dto.js), — форма говорит о них сама, до
 * «Сохранить черновик». Ключи новых вопросов и вариантов выдаёт конструктор: модуль остаётся чистым.
 */

/** Пределы полей — как на сервере (SURVEY_LIMITS). */
export const DRAFT_LIMITS = Object.freeze({
  title: 255,
  description: 1000,
  questions: 50,
  questionText: 500,
  options: Object.freeze({ min: 2, max: 20 }),
  optionText: 200,
});

export type DraftOption = { key: string; text: string };

export interface DraftQuestion {
  /** Ключ в списке: «q{id}» у сохранённого вопроса, выданный конструктором — у нового. */
  key: string;
  type: SurveyQuestionType;
  text: string;
  /** Варианты «Один / Несколько вариантов»; при смене типа остаются, но уходят на сервер только у них. */
  options: DraftOption[];
  /** Подписи шкалы, заданные раньше (в конструкторе их нет): сохраняются как были. */
  scaleMinLabel: string | null;
  scaleMaxLabel: string | null;
}

export interface SurveyDraft {
  title: string;
  description: string;
  /** «Все офисы» — и те, что появятся позже; officeIds тогда пуст. */
  allOffices: boolean;
  officeIds: number[];
  anonymous: boolean;
  questions: DraftQuestion[];
}

/** Новый ключ вопроса или варианта. */
export type NextKey = () => string;

export const isChoiceQuestion = (type: SurveyQuestionType) => type === "single_choice" || type === "multiple_choice";

/** Новый опрос: пустые поля, офисы не выбраны, ответы анонимны. */
export const emptyDraft = (): SurveyDraft => ({
  title: "",
  description: "",
  allOffices: false,
  officeIds: [],
  anonymous: true,
  questions: [],
});

/** Сохранённый черновик в форме. */
export function draftFromSurvey(survey: AdminSurveyDetail): SurveyDraft {
  return {
    title: survey.title,
    description: survey.description ?? "",
    allOffices: survey.all_offices,
    officeIds: survey.offices.map((office) => office.id),
    anonymous: survey.is_anonymous,
    questions: survey.questions.map((question) => ({
      key: `q${question.id}`,
      type: question.type,
      text: question.text,
      options: isChoiceQuestion(question.type)
        ? question.options.map((option) => ({ key: `o${option.id}`, text: option.text }))
        : [],
      scaleMinLabel: question.scale_min_label,
      scaleMaxLabel: question.scale_max_label,
    })),
  };
}

const emptyOptions = (nextKey: NextKey): DraftOption[] => [
  { key: nextKey(), text: "" },
  { key: nextKey(), text: "" },
];

/** Новый вопрос: у вопроса с вариантами — два пустых варианта, меньше сервер не примет. */
export function newQuestion(type: SurveyQuestionType, nextKey: NextKey): DraftQuestion {
  return {
    key: nextKey(),
    type,
    text: "",
    options: isChoiceQuestion(type) ? emptyOptions(nextKey) : [],
    scaleMinLabel: null,
    scaleMaxLabel: null,
  };
}

/** Другой тип ответа: варианты остаются; вопросу с вариантами, у которого их нет, — два пустых. */
export function withType(question: DraftQuestion, type: SurveyQuestionType, nextKey: NextKey): DraftQuestion {
  const options = isChoiceQuestion(type) && !question.options.length ? emptyOptions(nextKey) : question.options;
  return { ...question, type, options };
}

/** «Добавить вариант»: не больше DRAFT_LIMITS.options.max. */
export function addOption(question: DraftQuestion, nextKey: NextKey): DraftQuestion {
  if (question.options.length >= DRAFT_LIMITS.options.max) return question;
  return { ...question, options: [...question.options, { key: nextKey(), text: "" }] };
}

export const changeOption = (question: DraftQuestion, key: string, text: string): DraftQuestion => ({
  ...question,
  options: question.options.map((option) => (option.key === key ? { ...option, text } : option)),
});

export const removeOption = (question: DraftQuestion, key: string): DraftQuestion => ({
  ...question,
  options: question.options.filter((option) => option.key !== key),
});

/** Строка `key` встаёт на место строки `overKey`, остальные сдвигаются; с неизвестным ключом — список как был. */
function moveByKey<T extends { key: string }>(items: T[], key: string, overKey: string): T[] {
  const from = items.findIndex((item) => item.key === key);
  const to = items.findIndex((item) => item.key === overKey);
  if (from < 0 || to < 0 || from === to) return items;
  const moved = [...items];
  moved.splice(to, 0, ...moved.splice(from, 1));
  return moved;
}

/** Порядок вариантов перетаскиванием за «⋮⋮». */
export const moveOption = (question: DraftQuestion, key: string, overKey: string): DraftQuestion => ({
  ...question,
  options: moveByKey(question.options, key, overKey),
});

/** Варианты, которые уйдут на сервер: без пробелов по краям, пустые отброшены. */
export const filledOptions = (question: DraftQuestion) =>
  question.options.map((option) => option.text.trim()).filter(hasVisibleText);

export type QuestionProblems = { text?: string; options?: string };

/** Что мешает сохранить вопрос; варианты сравниваются без учёта регистра, как на сервере. */
export function questionProblems(question: DraftQuestion): QuestionProblems {
  const problems: QuestionProblems = {};
  if (!hasVisibleText(question.text)) problems.text = DRAFT_MESSAGES.questionText;
  if (isChoiceQuestion(question.type)) {
    const options = filledOptions(question);
    if (options.length < DRAFT_LIMITS.options.min) problems.options = DRAFT_MESSAGES.fewOptions;
    else if (new Set(options.map((text) => text.toLocaleLowerCase("ru"))).size < options.length) {
      problems.options = DRAFT_MESSAGES.repeatedOption;
    }
  }
  return problems;
}

export const hasQuestionProblems = (problems: QuestionProblems) => Boolean(problems.text || problems.options);

export type DraftProblems = {
  title?: string;
  /** По ключу вопроса — только вопросы с ошибками. */
  questions: Record<string, QuestionProblems>;
};

/** Что мешает сохранить черновик: заголовок и вопросы. Офисы нужны только для публикации. */
export function draftProblems(draft: SurveyDraft): DraftProblems {
  const questions: Record<string, QuestionProblems> = {};
  for (const question of draft.questions) {
    const problems = questionProblems(question);
    if (hasQuestionProblems(problems)) questions[question.key] = problems;
  }
  return { title: hasVisibleText(draft.title) ? undefined : DRAFT_MESSAGES.title, questions };
}

export const hasDraftProblems = (problems: DraftProblems) => Boolean(problems.title) || Object.keys(problems.questions).length > 0;

/** Пункт «Все офисы» включает все офисы разом и так же снимает. */
export const toggleAllOffices = (draft: SurveyDraft): SurveyDraft => ({ ...draft, allOffices: !draft.allOffices, officeIds: [] });

/** Отдельный офис; при «Все офисы» снятие одного оставляет выбранными остальные. Порядок — как в списке офисов. */
export function toggleOffice(draft: SurveyDraft, officeId: number, allIds: readonly number[]): SurveyDraft {
  if (draft.allOffices) return { ...draft, allOffices: false, officeIds: allIds.filter((id) => id !== officeId) };
  const chosen = new Set(draft.officeIds);
  if (chosen.has(officeId)) chosen.delete(officeId);
  else chosen.add(officeId);
  return { ...draft, officeIds: allIds.filter((id) => chosen.has(id)) };
}

/** Новый вопрос — в конец списка, изменённый — на своё место. */
export function putQuestion(draft: SurveyDraft, question: DraftQuestion): SurveyDraft {
  const exists = draft.questions.some((item) => item.key === question.key);
  return {
    ...draft,
    questions: exists
      ? draft.questions.map((item) => (item.key === question.key ? question : item))
      : [...draft.questions, question],
  };
}

export type RemovedQuestion = { question: DraftQuestion; index: number };

/** Удаление вопроса; removed — что вернёт «Вернуть». */
export function removeQuestion(draft: SurveyDraft, key: string): { draft: SurveyDraft; removed: RemovedQuestion | null } {
  const index = draft.questions.findIndex((question) => question.key === key);
  if (index < 0) return { draft, removed: null };
  return {
    draft: { ...draft, questions: draft.questions.filter((question) => question.key !== key) },
    removed: { question: draft.questions[index], index },
  };
}

/** «Вернуть»: вопрос встаёт туда, где стоял (или в конец, если список стал короче). */
export function restoreQuestion(draft: SurveyDraft, { question, index }: RemovedQuestion): SurveyDraft {
  if (draft.questions.some((item) => item.key === question.key)) return draft;
  const questions = [...draft.questions];
  questions.splice(Math.min(index, questions.length), 0, question);
  return { ...draft, questions };
}

/** Порядок вопросов перетаскиванием за «⋮⋮»: номера вопросов следуют за ним. */
export const moveQuestion = (draft: SurveyDraft, key: string, overKey: string): SurveyDraft => ({
  ...draft,
  questions: moveByKey(draft.questions, key, overKey),
});

function questionInput(question: DraftQuestion): SurveyQuestionDraft {
  const text = question.text.trim();
  switch (question.type) {
    case "single_choice":
    case "multiple_choice":
      return { type: question.type, text, options: filledOptions(question) };
    case "rating":
      return { type: "rating", text, scale_min_label: question.scaleMinLabel, scale_max_label: question.scaleMaxLabel };
    default:
      return { type: question.type, text };
  }
}

/** Черновик для POST и PUT: тексты без пробелов по краям, пустое описание — null, при «Все офисы» список офисов пуст. */
export function draftInput(draft: SurveyDraft): SurveyDraftInput {
  return {
    title: draft.title.trim(),
    description: hasVisibleText(draft.description) ? draft.description.trim() : null,
    is_anonymous: draft.anonymous,
    all_offices: draft.allOffices,
    office_ids: draft.allOffices ? [] : draft.officeIds,
    questions: draft.questions.map(questionInput),
  };
}

/** Снимок для «есть несохранённые правки»: черновики сравниваются по тому, что ушло бы на сервер. */
export const draftSnapshot = (draft: SurveyDraft) => JSON.stringify(draftInput(draft));
