import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import * as drafts from '../lib/create-request-draft.ts';

const { createRequestDraftScope, saveCreateRequestDraft, readCreateRequestDraft, clearCreateRequestDraft, clearCreateRequestDrafts, createRequestSubmitGate } = drafts;
const auth = (id, role = 'client') => ({ token: 'secret-token', user: { id }, role, isGuest: false });
const scope = createRequestDraftScope(auth(7));
const draft = {
  requestType: 'planned', locationDetails: 'Северное крыло', plannedDate: '2026-10-02',
  subRequests: [{ title: 'Освещение', description: 'Не работает свет', category_id: 2, subcategory_id: 3, complexity: 'medium', sla: '2h', executors: [{ id: 5, role: 'leader' }] }],
  isRecurringTask: false, completionComment: 'Описание результата', completionDate: '2026-09-30T06:00:00.000Z',
  selectedOfficeId: 4, locationSource: 'office', selectedCabinetRoomId: null,
  selectedBlock: 'A', selectedLocation: 'Этаж 2', selectedRoom: '201', customLocation: '', customRoom: '', currentStep: 4,
  recurrenceType: 'weekly', recurrenceInterval: 2, recurrenceStartDate: '2026-10-02T06:00:00.000Z',
  createMode: 'createAndComplete', hadAttachments: true,
};

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test('reload restores all whitelisted fields without storing photos, previews, names or credentials', () => {
  const storage = memoryStorage();
  clearCreateRequestDrafts(null);
  assert.equal(saveCreateRequestDraft(scope, { ...draft, photos: ['private.jpg'], photoPreviews: ['data:image/private'], token: 'secret-token' }, storage), 'session');
  const serialized = storage.getItem(storage.key(0));
  assert.doesNotMatch(serialized, /private\.jpg|data:image|secret-token|photoPreviews/);
  clearCreateRequestDrafts(null); // simulate a new JS context while keeping this tab's sessionStorage
  assert.deepEqual(readCreateRequestDraft(scope, storage), draft);
  assert.equal(readCreateRequestDraft(createRequestDraftScope(auth(8)), storage), null);
  assert.equal(readCreateRequestDraft(createRequestDraftScope(auth(7, 'executor')), storage), null);
  assert.equal(createRequestDraftScope({ ...auth(7), token: null }), null);
});

test('blocked sessionStorage preserves SPA draft in memory and discard removes it', () => {
  clearCreateRequestDrafts(null);
  const storage = { ...memoryStorage(), setItem() { throw new Error('Quota exceeded'); } };
  assert.equal(saveCreateRequestDraft(scope, draft, storage), 'memory');
  assert.deepEqual(readCreateRequestDraft(scope, null), draft);
  clearCreateRequestDraft(scope, storage);
  assert.equal(readCreateRequestDraft(scope, null), null);
});

test('invalid persisted data is ignored instead of restoring broken dates or another owner', () => {
  clearCreateRequestDrafts(null);
  const storage = memoryStorage();
  saveCreateRequestDraft(scope, draft, storage);
  const key = storage.key(0);
  clearCreateRequestDrafts(null);
  storage.setItem(key, JSON.stringify({ version: 1, scope, draft: { ...draft, completionDate: 'not a date' } }));
  assert.equal(readCreateRequestDraft(scope, storage), null);
  storage.setItem(key, JSON.stringify({ version: 1, scope: 'another-owner', draft }));
  assert.equal(readCreateRequestDraft(scope, storage), null);
  storage.setItem(key, '{broken JSON');
  assert.equal(readCreateRequestDraft(scope, storage), null);
});

test('actual auth actions clear drafts on logout and account switch, but retain same-account updates', async () => {
  const require = createRequire(import.meta.url);
  const storage = memoryStorage();
  storage.setItem('unrelated-setting', 'keep');
  clearCreateRequestDrafts(null);
  const code = ts.transpileModule(await readFile(new URL('../stores/useAuthStore.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, {
    module: loaded, exports: loaded.exports,
    require: (id) => id === '@/lib/create-request-draft'
      ? { ...drafts, clearCreateRequestDrafts: () => clearCreateRequestDrafts(storage) }
      : id === 'zustand/middleware' ? { persist: (initialize) => initialize } : require(id),
  });
  const store = loaded.exports.useAuthStore;
  store.getState().setAuth('one', 'client', { id: 7 });
  saveCreateRequestDraft(scope, draft, storage);
  store.getState().setAuth('refreshed', 'client', { id: 7 });
  assert.deepEqual(readCreateRequestDraft(scope, storage), draft);
  store.getState().setAuth('two', 'client', { id: 8 });
  assert.equal(readCreateRequestDraft(scope, storage), null);
  const secondScope = createRequestDraftScope(auth(8));
  saveCreateRequestDraft(secondScope, draft, storage);
  store.getState().clearAuth();
  assert.equal(readCreateRequestDraft(secondScope, storage), null);
  assert.equal(storage.getItem('unrelated-setting'), 'keep');
});

test('rapid submit calls share one in-flight operation and failure allows retry', async () => {
  const gate = createRequestSubmitGate();
  let calls = 0;
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const first = gate.run(async () => { calls++; await pending; return true; });
  const second = gate.run(async () => { calls++; return true; });
  assert.equal(calls, 1, 'lock must be active before the first await/React rerender');
  assert.equal(await second, undefined);
  assert.equal(gate.isPending(), true);
  finish();
  assert.equal(await first, true);
  assert.equal(gate.isPending(), false);
  await assert.rejects(gate.run(async () => { throw new Error('Network failed'); }));
  assert.equal(gate.isPending(), false);
  assert.equal(await gate.run(async () => false), false);
});
