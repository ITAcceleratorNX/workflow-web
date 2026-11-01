import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

/** Модуль lib/surveys с подставленными зависимостями: pass.ts берёт правила ответов из answers.ts. */
function load(name, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../lib/surveys/${name}.ts`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: (id) => dependencies[id] });
  return loaded.exports;
}
// Объекты из модуля созданы в другом realm: сравниваем их как данные.
const plain = (value) => JSON.parse(JSON.stringify(value));
const { INITIAL_PASS, passReducer } = load('pass', { './answers': load('answers') });

/** Три вопроса опроса из макета, как их отдаёт GET /surveys/:id. */
const questions = [
  { id: 11, type: 'single_choice', text: 'Как часто вы пользуетесь разделом «Задачи»?', scale_min_label: null, scale_max_label: null,
    options: [{ id: 101, text: 'Каждый день' }, { id: 102, text: 'Несколько раз в неделю' }] },
  { id: 12, type: 'multiple_choice', text: 'Какие функции раздела вы используете чаще всего?', scale_min_label: null, scale_max_label: null,
    options: [{ id: 201, text: 'Список задач' }, { id: 202, text: 'Календарь' }] },
  { id: 15, type: 'text', text: 'Что бы вы улучшили в разделе «Задачи»?', scale_min_label: null, scale_max_label: null, options: [] },
];

const run = (actions, state = INITIAL_PASS) => actions.reduce((current, action) => passReducer(questions, current, action), state);
const answerAll = [
  { type: 'start' },
  { type: 'answer', questionId: 11, answer: { optionIds: [101] } },
  { type: 'next' },
  { type: 'answer', questionId: 12, answer: { optionIds: [201, 202] } },
  { type: 'next' },
  { type: 'answer', questionId: 15, answer: { text: 'Быстрее менять срок' } },
];

test('the intro leads to the first question', () => {
  assert.deepEqual(plain(INITIAL_PASS), { screen: 'intro', index: 0, answers: {}, sending: false });
  assert.deepEqual(plain(run([{ type: 'start' }])), { screen: 'question', index: 0, answers: {}, sending: false });
  assert.equal(passReducer([], INITIAL_PASS, { type: 'start' }), INITIAL_PASS);
});

test('«Далее» waits for an answer, «Назад» stops at the first question', () => {
  const first = run([{ type: 'start' }]);
  assert.equal(run([{ type: 'next' }], first), first);
  assert.equal(run([{ type: 'back' }], first), first);

  const second = run([{ type: 'answer', questionId: 11, answer: { optionIds: [101] } }, { type: 'next' }], first);
  assert.equal(second.index, 1);
  assert.equal(run([{ type: 'answer', questionId: 12, answer: { optionIds: [] } }, { type: 'next' }], second).index, 1);
  assert.equal(run([{ type: 'back' }], second).index, 0);
  assert.deepEqual(plain(run([{ type: 'back' }], second).answers), { 11: { optionIds: [101] } });
});

test('there is no question after the last one: it is sent', () => {
  const last = run(answerAll);
  assert.equal(last.index, 2);
  assert.equal(run([{ type: 'next' }], last), last);
});

test('the answers stay as they are while being sent, then the screen says they were', () => {
  const sending = run([...answerAll, { type: 'send' }]);
  assert.equal(sending.sending, true);
  for (const action of [
    { type: 'answer', questionId: 15, answer: { text: 'Другой ответ' } },
    { type: 'back' },
    { type: 'send' },
    { type: 'review' },
  ]) {
    assert.equal(passReducer(questions, sending, action), sending);
  }
  assert.deepEqual(plain(run([{ type: 'sent' }], sending)), { ...plain(sending), screen: 'sent', sending: false });
});

test('after a failed send the answers stay and «Вернуться к вопросам» opens the last question', () => {
  const failed = run([...answerAll, { type: 'send' }, { type: 'failed' }]);
  assert.equal(failed.screen, 'failed');
  assert.equal(failed.sending, false);
  assert.deepEqual(plain(failed.answers), plain(run(answerAll).answers));

  const review = run([{ type: 'back' }, { type: 'review' }], failed);
  assert.equal(review.screen, 'question');
  assert.equal(review.index, 2);
  assert.equal(run([{ type: 'send' }], failed).sending, true);
});

test('a survey that stopped taking answers keeps the screen until it shows its state', () => {
  const sending = run([...answerAll, { type: 'send' }]);
  assert.deepEqual(plain(run([{ type: 'settled' }], sending)), { ...plain(sending), sending: false });
});
