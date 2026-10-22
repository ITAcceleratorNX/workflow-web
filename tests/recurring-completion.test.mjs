import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as dateTimeUtils from '../lib/dateTimeUtils.ts';

const source = await readFile(new URL('../lib/recurring-completion.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = { exports: {} };
vm.runInNewContext(compiled, {
  module: loaded,
  exports: loaded.exports,
  require: (name) => {
    assert.equal(name, '@/lib/dateTimeUtils');
    return dateTimeUtils;
  },
  Date,
});
const { nextOccurrenceAfterCompletion, recurringCompletionNotice } = loaded.exports;

// 09:00 в Алматы (UTC+5) = 04:00 UTC.
const today = '2026-10-22T04:00:00.000Z';
const tomorrow = '2026-10-23T04:00:00.000Z';
const now = new Date('2026-10-22T10:00:00.000Z');

test('a recurring task marked done is recognised by its move to the next occurrence', () => {
  // Ответ сервера: выполнение записано, задача снова не выполнена, но на завтра.
  assert.equal(
    nextOccurrenceAfterCompletion(
      { completed: false, scheduled_at: today, recurrence_type: 'daily' },
      { completed: false, scheduled_at: tomorrow, recurrence_type: 'daily' },
    ),
    tomorrow,
  );
  // В календаре у задачи нет типа повтора — он есть в ответе сервера.
  assert.equal(
    nextOccurrenceAfterCompletion({ completed: false, scheduled_at: today }, { completed: false, scheduled_at: tomorrow, recurrence_type: 'weekly' }),
    tomorrow,
  );
});

test('ordinary completion, reopening and the last occurrence are not a move', () => {
  assert.equal(nextOccurrenceAfterCompletion({ completed: false, scheduled_at: today, recurrence_type: 'none' }, { completed: true, scheduled_at: today }), null);
  assert.equal(nextOccurrenceAfterCompletion({ completed: true, scheduled_at: today, recurrence_type: 'daily' }, { completed: false, scheduled_at: today, recurrence_type: 'daily' }), null);
  assert.equal(nextOccurrenceAfterCompletion({ completed: false, scheduled_at: today, recurrence_type: 'daily' }, { completed: true, scheduled_at: today, recurrence_type: 'daily' }), null);
});

test('the notice names today, tomorrow or the date, with the time in Almaty', () => {
  assert.deepEqual({ ...recurringCompletionNotice(tomorrow, now) }, { title: 'Выполнено', description: 'Следующий повтор — завтра в 09:00' });
  assert.equal(recurringCompletionNotice('2026-10-22T13:30:00.000Z', now).description, 'Следующий повтор — сегодня в 18:30');
  assert.equal(recurringCompletionNotice('2026-10-26T04:00:00.000Z', now).description, 'Следующий повтор — пн, 26 октября в 09:00');
});
