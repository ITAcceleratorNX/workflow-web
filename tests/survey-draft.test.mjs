import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

/** Модуль lib/surveys с подставленными зависимостями: draft.ts берёт правила текста и слова из соседей. */
function load(name, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../lib/surveys/${name}.ts`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: (id) => dependencies[id] });
  return loaded.exports;
}
// Объекты из модуля созданы в другом realm: сравниваем их как данные.
const plain = (value) => JSON.parse(JSON.stringify(value));
const draft = load('draft', { './answers': load('answers'), './format': load('format') });

/** Ключи новых строк, как их выдаёт конструктор. */
const keys = () => {
  let next = 0;
  return () => `n${++next}`;
};

/** Черновик из макета, как его отдаёт GET /surveys/admin/:id. */
const saved = {
  id: 7, title: 'Удобство раздела «Задачи»', description: null, status: 'draft', is_anonymous: true, all_offices: false,
  offices: [{ id: 1, name: 'Алатау' }, { id: 2, name: 'Нурлы Тау' }],
  questions: [
    { id: 11, position: 0, type: 'single_choice', text: 'Как часто?', scale_min_label: null, scale_max_label: null,
      options: [{ id: 101, position: 0, text: 'Каждый день' }, { id: 102, position: 1, text: 'Реже' }] },
    { id: 13, position: 1, type: 'rating', text: 'Насколько удобно?', scale_min_label: 'Плохо', scale_max_label: 'Отлично', options: [] },
    { id: 14, position: 2, type: 'yes_no', text: 'Находите сразу?', scale_min_label: null, scale_max_label: null,
      options: [{ id: 401, position: 0, text: 'Да' }, { id: 402, position: 1, text: 'Нет' }] },
  ],
};

test('a saved draft opens in the form and goes back to the server as it was', () => {
  const form = draft.draftFromSurvey(saved);
  assert.deepEqual(plain(form.questions.map((q) => [q.key, q.type, q.options.map((o) => o.key)])), [
    ['q11', 'single_choice', ['o101', 'o102']], ['q13', 'rating', []], ['q14', 'yes_no', []],
  ]);
  assert.equal(form.description, '');
  assert.deepEqual(plain(draft.draftInput(form)), {
    title: 'Удобство раздела «Задачи»',
    description: null,
    is_anonymous: true,
    all_offices: false,
    office_ids: [1, 2],
    questions: [
      { type: 'single_choice', text: 'Как часто?', options: ['Каждый день', 'Реже'] },
      { type: 'rating', text: 'Насколько удобно?', scale_min_label: 'Плохо', scale_max_label: 'Отлично' },
      { type: 'yes_no', text: 'Находите сразу?' },
    ],
  });
});

test('a new survey is anonymous, without offices; texts are trimmed and empty options dropped', () => {
  const form = draft.emptyDraft();
  assert.deepEqual(plain(form), { title: '', description: '', allOffices: false, officeIds: [], anonymous: true, questions: [] });
  const question = { ...draft.newQuestion('multiple_choice', keys()), text: '  Что мешает?  ' };
  question.options = [{ key: 'a', text: ' Нет комнат ' }, { key: 'b', text: '   ' }, { key: 'c', text: 'Неудобно' }];
  const input = draft.draftInput({ ...form, title: ' Бронь ', description: ' ​ ', allOffices: true, officeIds: [1], questions: [question] });
  assert.equal(input.title, 'Бронь');
  assert.equal(input.description, null);
  assert.deepEqual(plain(input.office_ids), []);
  assert.deepEqual(plain(input.questions), [{ type: 'multiple_choice', text: 'Что мешает?', options: ['Нет комнат', 'Неудобно'] }]);
});

test('a new choice question starts with two empty options; other types have none', () => {
  const next = keys();
  const single = draft.newQuestion('single_choice', next);
  assert.deepEqual(plain(single), { key: 'n1', type: 'single_choice', text: '', options: [{ key: 'n2', text: '' }, { key: 'n3', text: '' }], scaleMinLabel: null, scaleMaxLabel: null });
  assert.deepEqual(plain(draft.newQuestion('text', next).options), []);
  assert.deepEqual(plain(draft.newQuestion('yes_no', next).options), []);
});

test('changing the type keeps the options for a choice question and gives two empty ones when there were none', () => {
  const next = keys();
  const single = { ...draft.newQuestion('single_choice', next), text: 'Как часто?' };
  const asText = draft.withType(single, 'text', next);
  assert.equal(asText.options.length, 2);
  assert.deepEqual(plain(draft.draftInput({ ...draft.emptyDraft(), questions: [asText] }).questions), [{ type: 'text', text: 'Как часто?' }]);
  assert.equal(draft.withType(asText, 'multiple_choice', next).options, asText.options);
  const fromRating = draft.withType(draft.newQuestion('rating', next), 'single_choice', next);
  assert.deepEqual(plain(fromRating.options.map((o) => o.text)), ['', '']);
});

test('options: add up to twenty, change and remove by key', () => {
  const next = keys();
  let question = draft.newQuestion('single_choice', next);
  for (let i = 0; i < 25; i += 1) question = draft.addOption(question, next);
  assert.equal(question.options.length, 20);
  const [first, second] = question.options;
  question = draft.changeOption(question, first.key, 'Каждый день');
  question = draft.removeOption(question, second.key);
  assert.equal(question.options.length, 19);
  assert.equal(question.options[0].text, 'Каждый день');
  assert.equal(question.options.some((o) => o.key === second.key), false);
});

test('a question needs its text, two options and no repeats ignoring case', () => {
  const choice = (texts, text = 'Как часто?') => ({
    key: 'q', type: 'single_choice', text, scaleMinLabel: null, scaleMaxLabel: null,
    options: texts.map((t, i) => ({ key: `o${i}`, text: t })),
  });
  assert.deepEqual(plain(draft.questionProblems(choice(['Да', 'Нет']))), {});
  assert.deepEqual(plain(draft.questionProblems(choice(['Да', 'Нет'], ' ​'))), { text: 'Введите текст вопроса' });
  assert.deepEqual(plain(draft.questionProblems(choice(['Да', '  ']))), { options: 'Нужно хотя бы 2 варианта' });
  assert.deepEqual(plain(draft.questionProblems(choice(['Каждый день', ' каждый ДЕНЬ ']))), { options: 'Варианты не должны повторяться' });
  assert.deepEqual(plain(draft.questionProblems({ ...choice([]), type: 'rating' })), {});
});

test('a draft needs a title; problems are kept by question', () => {
  const form = draft.draftFromSurvey(saved);
  assert.equal(draft.hasDraftProblems(draft.draftProblems(form)), false);
  const broken = { ...form, title: '  ', questions: [{ ...form.questions[0], text: '' }, form.questions[1]] };
  const problems = plain(draft.draftProblems(broken));
  assert.deepEqual(problems, { title: 'Введите заголовок', questions: { q11: { text: 'Введите текст вопроса' } } });
  assert.equal(draft.hasDraftProblems(draft.draftProblems(broken)), true);
});

test('«Все офисы» takes every office at once; unticking one keeps the others', () => {
  const all = [1, 2, 3];
  let form = draft.emptyDraft();
  form = draft.toggleOffice(form, 2, all);
  form = draft.toggleOffice(form, 1, all);
  assert.deepEqual(plain(form.officeIds), [1, 2]);
  form = draft.toggleAllOffices(form);
  assert.deepEqual([form.allOffices, plain(form.officeIds)], [true, []]);
  form = draft.toggleOffice(form, 3, all);
  assert.deepEqual([form.allOffices, plain(form.officeIds)], [false, [1, 2]]);
  assert.deepEqual(plain(draft.toggleAllOffices(draft.toggleAllOffices(form))), { ...plain(form), officeIds: [] });
});

test('a removed question comes back to its place', () => {
  const form = draft.draftFromSurvey(saved);
  const { draft: without, removed } = draft.removeQuestion(form, 'q13');
  assert.deepEqual(plain(without.questions.map((q) => q.key)), ['q11', 'q14']);
  assert.equal(removed.index, 1);
  assert.deepEqual(plain(draft.restoreQuestion(without, removed).questions.map((q) => q.key)), ['q11', 'q13', 'q14']);
  assert.equal(draft.restoreQuestion(form, removed), form);
  assert.equal(draft.removeQuestion(form, 'missing').removed, null);
});

test('a saved question replaces itself, a new one goes last; snapshots notice any change', () => {
  const form = draft.draftFromSurvey(saved);
  const edited = draft.putQuestion(form, { ...form.questions[1], text: 'Удобно ли?' });
  assert.deepEqual(plain(edited.questions.map((q) => [q.key, q.text])), [['q11', 'Как часто?'], ['q13', 'Удобно ли?'], ['q14', 'Находите сразу?']]);
  const added = draft.putQuestion(form, { ...draft.newQuestion('text', keys()), text: 'Что улучшить?' });
  assert.deepEqual(plain(added.questions.map((q) => q.key)), ['q11', 'q13', 'q14', 'n1']);
  assert.equal(draft.draftSnapshot(form), draft.draftSnapshot(draft.draftFromSurvey(saved)));
  assert.notEqual(draft.draftSnapshot(form), draft.draftSnapshot(edited));
});
