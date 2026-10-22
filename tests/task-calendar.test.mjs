import assert from 'node:assert/strict';
import test from 'node:test';
import { calendarResultNotice, lastSyncedLabel } from '../lib/task-calendar.ts';

test('every result the server returns after Google has a message', () => {
  for (const result of [
    'google_connected',
    'google_denied',
    'google_scope_missing',
    'google_failed',
    'google_unavailable',
    'google_invalid_state',
  ]) {
    const notice = calendarResultNotice(result);
    assert.ok(notice, result);
    assert.equal(notice.tone, result === 'google_connected' ? 'success' : 'error');
  }
});

test('no message without a known result', () => {
  assert.equal(calendarResultNotice(null), null);
  assert.equal(calendarResultNotice(''), null);
  assert.equal(calendarResultNotice('something_else'), null);
});

test('the last sync is shown in Almaty time', () => {
  assert.equal(lastSyncedLabel('2026-10-21T21:09:55.575Z'), 'Синхронизировано 22 октября в 02:09');
  assert.equal(lastSyncedLabel(null), null);
  assert.equal(lastSyncedLabel('not a date'), null);
});
