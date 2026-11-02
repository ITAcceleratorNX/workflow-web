import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ANSWER_TEXT_LIMIT,
  answerTextLength,
  chooseOption,
  firstUnanswered,
  isAnswered,
  submissionAnswers,
  submitOutcome,
} from '../lib/surveys/answers.ts';
import {
  ADMIN_SURVEY_FILTERS,
  adminResponsesLabel,
  adminStatusLabel,
  adminSurveyMeta,
  adminSurveysEmpty,
  bannerSummary,
  completedLabel,
  durationAboutLabel,
  durationLabel,
  durationShortLabel,
  questionCounter,
  questionHint,
  questionsCountLabel,
  scaleLabels,
} from '../lib/surveys/format.ts';
import {
  availableSurveys,
  completedSurveys,
  filterAdminSurveys,
  hasAvailableSurveys,
  latestAvailableSurvey,
} from '../lib/surveys/list.ts';

/** Вопросы опроса из макета, как их отдаёт GET /surveys/:id. */
const questions = [
  { id: 11, type: 'single_choice', text: 'Как часто вы пользуетесь разделом «Задачи»?', scale_min_label: null, scale_max_label: null,
    options: [{ id: 101, text: 'Каждый день' }, { id: 102, text: 'Несколько раз в неделю' }, { id: 103, text: 'Реже раза в неделю' }, { id: 104, text: 'Не пользуюсь' }] },
  { id: 12, type: 'multiple_choice', text: 'Какие функции раздела вы используете чаще всего?', scale_min_label: null, scale_max_label: null,
    options: [{ id: 201, text: 'Список задач' }, { id: 202, text: 'Календарь' }, { id: 203, text: 'Статистика' }, { id: 204, text: 'Команды' }] },
  { id: 13, type: 'rating', text: 'Насколько удобно создавать новую задачу?', scale_min_label: 'Совсем неудобно', scale_max_label: 'Очень удобно', options: [] },
  { id: 14, type: 'yes_no', text: 'Получается ли найти нужную задачу с первого раза?', scale_min_label: null, scale_max_label: null,
    options: [{ id: 401, text: 'Да' }, { id: 402, text: 'Нет' }] },
  { id: 15, type: 'text', text: 'Что бы вы улучшили в разделе «Задачи»?', scale_min_label: null, scale_max_label: null, options: [] },
];
const [single, multiple, rating, yesNo, text] = questions;

const mockupAnswers = {
  11: { optionIds: [101] },
  12: { optionIds: [201, 203] },
  13: { rating: 4 },
  14: { optionIds: [401] },
  15: { text: '  Хотелось бы быстрее менять срок задачи прямо из списка.\n' },
};

test('counts questions and minutes in the words of the mockups', () => {
  assert.deepEqual([1, 2, 4, 5, 11, 21, 22].map(questionsCountLabel), [
    '1 вопрос', '2 вопроса', '4 вопроса', '5 вопросов', '11 вопросов', '21 вопрос', '22 вопроса',
  ]);
  assert.deepEqual([1, 2, 5, 21].map(durationLabel), ['~1 минута', '~2 минуты', '~5 минут', '~21 минута']);
  assert.deepEqual([1, 2, 5, 21].map(durationAboutLabel), ['около 1 минуты', 'около 2 минут', 'около 5 минут', 'около 21 минуты']);
  assert.deepEqual([1, 2, 21].map(durationShortLabel), ['1 мин', '2 мин', '21 мин']);
});

test('builds the summary of the Desktop banner of a new survey', () => {
  const survey = { questions_count: 5, estimated_minutes: 2 };
  assert.equal(bannerSummary(survey), '5 вопросов · около 2 минут · правильных ответов нет');
  assert.equal(bannerSummary({ ...survey, estimated_minutes: null }), '5 вопросов · правильных ответов нет');
});

test('says when a survey was completed: today, a day of this year or of another one', () => {
  assert.equal(completedLabel('2026-11-01', '2026-11-01'), 'Пройдено сегодня. Спасибо за ответы!');
  assert.equal(completedLabel('2026-10-21', '2026-11-01'), 'Пройдено 21 октября. Спасибо за ответы!');
  assert.equal(completedLabel('2025-12-31', '2026-01-02'), 'Пройдено 31 декабря 2025. Спасибо за ответы!');
});

test('gives each question type its hint, and a rating its labels or those of the mockup', () => {
  assert.deepEqual(questions.map(questionHint), [
    'Выберите один вариант',
    'Можно выбрать несколько вариантов',
    '1 — совсем неудобно, 5 — очень удобно',
    'Выберите один ответ',
    'Напишите ответ своими словами',
  ]);
  const own = { ...rating, scale_min_label: 'Плохо', scale_max_label: 'Отлично' };
  assert.equal(questionHint(own), '1 — плохо, 5 — отлично');
  assert.deepEqual(scaleLabels({ ...rating, scale_min_label: null, scale_max_label: null }), { min: 'Совсем неудобно', max: 'Очень удобно' });
  assert.equal(questionCounter(1, 5), '2 из 5');
});

test('a tap replaces the choice of a single answer and toggles one of several, in option order', () => {
  assert.deepEqual(chooseOption(single, { optionIds: [101] }, 103), { optionIds: [103] });
  assert.deepEqual(chooseOption(yesNo, undefined, 402), { optionIds: [402] });
  const two = chooseOption(multiple, chooseOption(multiple, undefined, 203), 201);
  assert.deepEqual(two, { optionIds: [201, 203] });
  assert.deepEqual(chooseOption(multiple, two, 203), { optionIds: [201] });
});

test('accepts only an answer the server takes: every question is required', () => {
  assert.equal(isAnswered(single, undefined), false);
  assert.equal(isAnswered(single, { optionIds: [101, 102] }), false);
  assert.equal(isAnswered(multiple, { optionIds: [] }), false);
  assert.equal(isAnswered(multiple, { optionIds: [201, 204] }), true);
  for (const value of [0, 6, 2.5]) assert.equal(isAnswered(rating, { rating: value }), false, String(value));
  assert.equal(isAnswered(rating, { rating: 5 }), true);
  assert.equal(isAnswered(rating, { optionIds: [1] }), false, 'a value of another type');
  for (const value of ['', '   ', '​\n']) assert.equal(isAnswered(text, { text: value }), false, JSON.stringify(value));
  assert.equal(isAnswered(text, { text: '😀'.repeat(ANSWER_TEXT_LIMIT) }), true, 'an emoji is one character, as on the server');
  assert.equal(isAnswered(text, { text: 'x'.repeat(ANSWER_TEXT_LIMIT + 1) }), false);
  assert.equal(answerTextLength('Ответ 😀'), 7);
});

test('sends the answers in the order of the questions, the text trimmed, once all are given', () => {
  assert.deepEqual(submissionAnswers(questions, mockupAnswers), [
    { question_id: 11, option_ids: [101] },
    { question_id: 12, option_ids: [201, 203] },
    { question_id: 13, rating: 4 },
    { question_id: 14, option_ids: [401] },
    { question_id: 15, text: 'Хотелось бы быстрее менять срок задачи прямо из списка.' },
  ]);
  const withoutRating = { ...mockupAnswers, 13: undefined };
  assert.equal(submissionAnswers(questions, withoutRating), null);
  assert.equal(firstUnanswered(questions, withoutRating), 2);
  assert.equal(firstUnanswered(questions, mockupAnswers), -1);
});

test('turns the answer to «Отправить» into what the screen shows', () => {
  assert.equal(submitOutcome({ ok: true }), 'completed');
  assert.equal(submitOutcome({ ok: false, code: 'SURVEY_ALREADY_COMPLETED' }), 'already-completed');
  assert.equal(submitOutcome({ ok: false, code: 'SURVEY_CLOSED' }), 'closed');
  assert.equal(submitOutcome({ ok: false, code: 'SURVEY_NOT_FOUND' }), 'unavailable');
  assert.equal(submitOutcome({ ok: false }), 'failed', 'no connection keeps the answers for a retry');
  assert.equal(submitOutcome({ ok: false, code: 'SURVEY_ANSWERS_INVALID' }), 'failed');
});

test('shows the dot and the new survey card while an open survey is not taken', () => {
  const list = [
    { id: 5, state: 'available' }, { id: 4, state: 'available' }, { id: 2, state: 'completed' }, { id: 1, state: 'completed' },
  ];
  assert.equal(hasAvailableSurveys(list), true);
  assert.equal(latestAvailableSurvey(list).id, 5);
  assert.deepEqual(availableSurveys(list).map((s) => s.id), [5, 4]);
  assert.deepEqual(completedSurveys(list).map((s) => s.id), [2, 1]);
  const done = list.filter((s) => s.state === 'completed');
  assert.equal(hasAvailableSurveys(done), false);
  assert.equal(latestAvailableSurvey(done), null);
});

test('the admin list: the «Статус» filter, the status badges and the empty list', () => {
  assert.deepEqual(ADMIN_SURVEY_FILTERS.map((filter) => filter.label), ['Все', 'Черновики', 'Опубликованные', 'Завершённые']);
  assert.deepEqual(['draft', 'published', 'closed'].map(adminStatusLabel), ['Черновик', 'Опубликован', 'Завершён']);
  assert.deepEqual(adminSurveysEmpty('all'), {
    title: 'Опросов пока нет',
    description: 'Добавьте первый опрос, чтобы узнать мнение пользователей о Workflow',
  });
  assert.deepEqual(['draft', 'published', 'closed'].map((filter) => adminSurveysEmpty(filter).title), [
    'Черновиков нет', 'Опубликованных опросов нет', 'Завершённых опросов нет',
  ]);
  assert.equal(adminSurveysEmpty('draft').description, undefined);
});

test('a card of the admin list says when its survey was changed, published or closed', () => {
  const moments = { updated_at: 'U', published_at: 'P', closed_at: 'C' };
  const when = (iso) => `<${iso}>`;
  assert.equal(adminSurveyMeta({ ...moments, status: 'published', questions_count: 5 }, when), '5 вопросов · <P>');
  assert.equal(adminSurveyMeta({ ...moments, status: 'draft', questions_count: 3 }, when), '3 вопроса · изменён <U>');
  assert.equal(adminSurveyMeta({ ...moments, status: 'closed', questions_count: 4 }, when), '4 вопроса · завершён <C>');
  assert.equal(adminSurveyMeta({ ...moments, status: 'draft', questions_count: 0, published_at: null }, when), '0 вопросов · изменён <U>');
  assert.equal(adminResponsesLabel(23), 'Ответы: 23');
});

test('the admin list keeps the order of the server within a status', () => {
  const surveys = [{ id: 4, status: 'draft' }, { id: 3, status: 'published' }, { id: 2, status: 'closed' }, { id: 1, status: 'published' }];
  assert.deepEqual(filterAdminSurveys(surveys, 'all').map((s) => s.id), [4, 3, 2, 1]);
  assert.deepEqual(filterAdminSurveys(surveys, 'draft').map((s) => s.id), [4]);
  assert.deepEqual(filterAdminSurveys(surveys, 'published').map((s) => s.id), [3, 1]);
  assert.deepEqual(filterAdminSurveys(surveys, 'closed').map((s) => s.id), [2]);
});
