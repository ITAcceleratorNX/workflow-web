import type { AdminSurvey, ClientSurvey, SurveyQuestion, SurveyQuestionType, SurveyStatus } from "./types";

/**
 * Слова экранов опросов (Figma «workflow», клиент Mobile и Desktop): одни на мобильную и десктопную
 * вёрстку. Модуль чистый, без импортов значений — тесты подключают его напрямую.
 */

const PLURAL = new Intl.PluralRules("ru-RU");

/** 1 вопрос, 2 вопроса, 5 вопросов: формы [один, несколько, много]. */
export function pluralRu(count: number, [one, few, many]: readonly [string, string, string]): string {
  const category = PLURAL.select(count);
  if (category === "one") return one;
  return category === "few" ? few : many;
}

/** «5 вопросов» */
export const questionsCountLabel = (count: number) => `${count} ${pluralRu(count, ["вопрос", "вопроса", "вопросов"])}`;

/** «~2 минуты» — карточка списка и вступление. */
export const durationLabel = (minutes: number) => `~${minutes} ${pluralRu(minutes, ["минута", "минуты", "минут"])}`;

/** «около 2 минут» — баннер Desktop: после «около» родительный падеж. */
export const durationAboutLabel = (minutes: number) => `около ${minutes} ${pluralRu(minutes, ["минуты", "минут", "минут"])}`;

/** «2 мин» — карточка «Новый опрос» на главной, после названия: «Удобство раздела «Задачи» · 2 мин». */
export const durationShortLabel = (minutes: number) => `${minutes} мин`;

/** «5 вопросов · около 2 минут · правильных ответов нет» — баннер «Новый опрос» на Desktop. */
export function bannerSummary(survey: Pick<ClientSurvey, "questions_count" | "estimated_minutes">): string {
  const parts = [questionsCountLabel(survey.questions_count)];
  if (survey.estimated_minutes != null) parts.push(durationAboutLabel(survey.estimated_minutes));
  return [...parts, "правильных ответов нет"].join(" · ");
}

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/**
 * «Пройдено сегодня. Спасибо за ответы!» или «Пройдено 21 октября. …» — карточка пройденного опроса.
 * Даты — ключи YYYY-MM-DD в часовом поясе приложения; год пишется, если он не текущий.
 */
export function completedLabel(completedDateKey: string, todayKey: string): string {
  if (completedDateKey === todayKey) return "Пройдено сегодня. Спасибо за ответы!";
  const [year, month, day] = completedDateKey.split("-").map(Number);
  const yearPart = String(year) === todayKey.slice(0, 4) ? "" : ` ${year}`;
  return `Пройдено ${day} ${MONTHS_GENITIVE[month - 1]}${yearPart}. Спасибо за ответы!`;
}

/** Подписи крайних значений оценки, когда Администратор их не задал, — как в макете. */
export const DEFAULT_SCALE_LABELS = Object.freeze({ min: "Совсем неудобно", max: "Очень удобно" });

type ScaleQuestion = Pick<SurveyQuestion, "scale_min_label" | "scale_max_label">;

export function scaleLabels(question: ScaleQuestion): { min: string; max: string } {
  return {
    min: question.scale_min_label ?? DEFAULT_SCALE_LABELS.min,
    max: question.scale_max_label ?? DEFAULT_SCALE_LABELS.max,
  };
}

const lowerFirst = (text: string) => text.charAt(0).toLocaleLowerCase("ru-RU") + text.slice(1);

/** Подсказка под текстом вопроса — по типу, как в макетах. */
export function questionHint(question: Pick<SurveyQuestion, "type"> & ScaleQuestion): string {
  switch (question.type) {
    case "single_choice":
      return "Выберите один вариант";
    case "multiple_choice":
      return "Можно выбрать несколько вариантов";
    case "yes_no":
      return "Выберите один ответ";
    case "text":
      return "Напишите ответ своими словами";
    case "rating": {
      const { min, max } = scaleLabels(question);
      return `1 — ${lowerFirst(min)}, 5 — ${lowerFirst(max)}`;
    }
  }
}

/** «2 из 5»: Desktop пишет так, Mobile — «Вопрос 2 из 5». index — с нуля. */
export const questionCounter = (index: number, total: number) => `${index + 1} из ${total}`;

// ─── Администратор: «Управление новостями» → «Опросы» ──────────────────────

export type AdminSurveyFilter = "all" | SurveyStatus;

/** Фильтр «Статус» (Figma «Список после публикации»); «Завершённые» добавлены по ТЗ. */
export const ADMIN_SURVEY_FILTERS: readonly { value: AdminSurveyFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "draft", label: "Черновики" },
  { value: "published", label: "Опубликованные" },
  { value: "closed", label: "Завершённые" },
];

const STATUS_LABELS: Record<SurveyStatus, string> = { draft: "Черновик", published: "Опубликован", closed: "Завершён" };

/** Плашка статуса на карточке опроса. */
export const adminStatusLabel = (status: SurveyStatus) => STATUS_LABELS[status];

const EMPTY_FILTER_TITLES: Record<SurveyStatus, string> = {
  draft: "Черновиков нет",
  published: "Опубликованных опросов нет",
  closed: "Завершённых опросов нет",
};

/** Пустой список: опросов нет совсем (текст макета) или нет опросов с выбранным статусом. */
export function adminSurveysEmpty(filter: AdminSurveyFilter): { title: string; description?: string } {
  if (filter === "all") {
    return { title: "Опросов пока нет", description: "Добавьте первый опрос, чтобы узнать мнение пользователей о Workflow" };
  }
  return { title: EMPTY_FILTER_TITLES[filter] };
}

type AdminSurveyMoments = Pick<AdminSurvey, "status" | "questions_count" | "updated_at" | "published_at" | "closed_at">;

/**
 * «5 вопросов · сегодня», «3 вопроса · изменён сегодня, 10:40», «4 вопроса · завершён 20 окт 2026» —
 * строка карточки опроса: черновик — когда изменён, опубликованный — когда опубликован, завершённый —
 * когда завершён. `when` пишет момент словами («сегодня», «20 окт 2026», со временем у черновика на Desktop).
 */
export function adminSurveyMeta(survey: AdminSurveyMoments, when: (iso: string) => string): string {
  const [prefix, moment] =
    survey.status === "draft"
      ? ["изменён ", survey.updated_at]
      : survey.status === "closed"
        ? ["завершён ", survey.closed_at ?? survey.updated_at]
        : ["", survey.published_at ?? survey.updated_at];
  return `${questionsCountLabel(survey.questions_count)} · ${prefix}${when(moment)}`;
}

/** «Ответы: 23» — под опубликованным и завершённым опросом. */
export const adminResponsesLabel = (count: number) => `Ответы: ${count}`;

// ─── Администратор: конструктор опроса ─────────────────────────────────────

/** Типы вопроса в порядке меню «Тип вопроса». */
export const QUESTION_TYPE_ORDER: readonly SurveyQuestionType[] = ["single_choice", "multiple_choice", "text", "rating", "yes_no"];

const QUESTION_TYPE_WORDS: Record<SurveyQuestionType, { label: string; description: string }> = {
  single_choice: { label: "Один вариант", description: "Клиент выбирает один ответ" },
  multiple_choice: { label: "Несколько вариантов", description: "Клиент выбирает несколько ответов" },
  text: { label: "Открытый ответ", description: "Поле для свободного текста" },
  rating: { label: "Оценка 1–5", description: "Шкала от 1 до 5" },
  yes_no: { label: "Да / Нет", description: "Две кнопки: Да и Нет" },
};

/** «Один вариант» — тип вопроса в меню, в карточке вопроса и в поле «Тип ответа». */
export const questionTypeLabel = (type: SurveyQuestionType) => QUESTION_TYPE_WORDS[type].label;

/** «Клиент выбирает один ответ» — пояснение типа в меню «Тип вопроса». */
export const questionTypeDescription = (type: SurveyQuestionType) => QUESTION_TYPE_WORDS[type].description;

const optionsCountLabel = (count: number) => `${count} ${pluralRu(count, ["вариант", "варианта", "вариантов"])}`;

/** «4 варианта», «4 варианта · можно несколько», «Шкала от 1 до 5» — строка вопроса в списке конструктора. */
export function questionSummary(type: SurveyQuestionType, optionsCount: number): string {
  switch (type) {
    case "single_choice":
      return optionsCountLabel(optionsCount);
    case "multiple_choice":
      return `${optionsCountLabel(optionsCount)} · можно несколько`;
    case "rating":
      return "Шкала от 1 до 5";
    case "yes_no":
      return "Да или Нет";
    case "text":
      return "Свободный текст";
  }
}

/** Подсказка под вариантами или под «Как увидит клиент» в редакторе вопроса; у «Да / Нет» её нет. */
export function questionEditorHint(type: SurveyQuestionType): string | null {
  switch (type) {
    case "single_choice":
      return "Клиент выберет один вариант";
    case "multiple_choice":
      return "Клиент сможет выбрать несколько вариантов";
    case "rating":
      return "Шкала фиксированная, от 1 до 5. Варианты добавлять не нужно";
    case "text":
      return "Клиент напишет ответ своими словами, до 500 символов";
    default:
      return null;
  }
}

/** Поле «Офисы»: «Все офисы» или названия через запятую; null — не выбран ни один. */
export function officesLabel(allOffices: boolean, names: readonly string[]): string | null {
  if (allOffices) return "Все офисы";
  return names.length ? names.join(", ") : null;
}

/** «Режим ответов»: увидит ли Администратор, кто ответил. */
export const responseModeHint = (anonymous: boolean) =>
  anonymous ? "Вы не увидите, кто как ответил" : "Вы увидите имена рядом с ответами";

/** Что мешает сохранить или опубликовать черновик (согласовано 02.11.2026). */
export const DRAFT_MESSAGES = Object.freeze({
  title: "Введите заголовок",
  questionText: "Введите текст вопроса",
  fewOptions: "Нужно хотя бы 2 варианта",
  repeatedOption: "Варианты не должны повторяться",
  offices: "Выберите офисы",
});
