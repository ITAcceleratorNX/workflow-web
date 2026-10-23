import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = await readFile(new URL('../hooks/use-todo-list.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function harness(result, guest = false) {
  const alerts = [];
  const requests = [];
  let invalidations = 0;
  const auth = { token: guest ? null : 'test-token', isGuest: guest };
  const state = { version: 0, bump: () => { invalidations++; } };
  const dependencies = {
    '@/lib/user-tasks-api': {
      deleteUserTask: async (id) => { requests.push(id); return typeof result === 'function' ? result() : result; },
      updateUserTask: async (id, patch) => { requests.push({ id, patch }); return result; },
    },
    '@/lib/task-recurrence': {},
    '@/lib/group-task-completion': { confirmTaskToggle: async () => true },
    '@/lib/recurring-completion': {
      nextOccurrenceAfterCompletion: (before, after) => (after.scheduled_at !== before.scheduled_at ? after.scheduled_at : null),
      recurringCompletionNotice: (nextAt) => ({ title: 'Выполнено', description: `Следующий повтор — ${nextAt}` }),
    },
    '@/lib/task-recipients-api': {},
    '@/stores/useAuthStore': { useAuthStore: (select) => select(auth) },
    '@/stores/user-tasks-invalidate-store': { useUserTasksInvalidateStore: (select) => select(state) },
    '@/hooks/use-toast': { useToast: () => ({ toast: (message) => alerts.push(message) }) },
    '@/components/tasks/task-toasts': {
      toastTaskCompleted: (toast) => toast({ title: 'Задача выполнена', variant: 'success' }),
      toastTaskDeleteFailed: (toast, failure, retry) => toast({ title: 'Не удалось удалить задачу', description: failure.error, network: failure.network, retry }),
      toastTaskError: (toast, title, description) => toast({ title, description, variant: 'error' }),
    },
  };
  const loaded = { exports: {} };
  vm.runInNewContext(compiled, {
    require: (id) => dependencies[id] ?? require(id),
    module: loaded, exports: loaded.exports,
  });
  let hook;
  function Probe() { hook = loaded.exports.useTodoList({ enabled: false }); return null; }
  renderToStaticMarkup(React.createElement(Probe));
  return { hook, alerts, requests, invalidations: () => invalidations };
}

test('failed task deletion returns false so the detail view remains open', async () => {
  const scenario = harness({ ok: false, error: 'Service unavailable' });
  assert.equal(await scenario.hook.removeTask({ id: 7, title: 'Task' }), false);
  assert.deepEqual(scenario.requests, [7]);
  assert.equal(scenario.invalidations(), 0);
  assert.equal(scenario.alerts[0].title, 'Не удалось удалить задачу');
});

test('successful task deletion explicitly allows navigation and refreshes lists', async () => {
  const scenario = harness({ ok: true });
  assert.equal(await scenario.hook.removeTask({ id: 7, title: 'Task' }), true);
  assert.equal(scenario.invalidations(), 1);
});

test('guest cannot delete or receive a successful deletion result', async () => {
  const scenario = harness({ ok: true }, true);
  assert.equal(await scenario.hook.removeTask({ id: 7, title: 'Task' }), false);
  assert.deepEqual(scenario.requests, []);
});

test('failed title save returns null and does not invalidate the detail draft', async () => {
  const scenario = harness({ ok: false, error: 'Service unavailable' });
  assert.equal(await scenario.hook.updateTask({ id: 7, title: 'Saved title' }, { title: 'Draft title' }), null);
  assert.equal(scenario.requests[0].id, 7);
  assert.equal(scenario.requests[0].patch.title, 'Draft title');
  assert.equal(scenario.invalidations(), 0);
  assert.equal(scenario.alerts[0].title, 'Не удалось сохранить изменения');
});

test('successful title save returns the confirmed server title before navigation', async () => {
  const savedTask = { id: 7, title: 'Confirmed title' };
  const scenario = harness({ ok: true, data: savedTask });
  assert.equal(await scenario.hook.updateTask({ id: 7, title: 'Old title' }, { title: 'Draft title' }), savedTask);
  assert.equal(scenario.invalidations(), 1);
  assert.equal(scenario.alerts.length, 0);
});

test('completing a recurring task explains why it is not done again', async () => {
  const tomorrow = '2026-10-23T04:00:00.000Z';
  const scenario = harness({ ok: true, data: { id: 7, completed: false, scheduled_at: tomorrow, recurrence_type: 'daily' } });
  await scenario.hook.toggleComplete({ id: 7, completed: false, scheduled_at: '2026-10-22T04:00:00.000Z', recurrence_type: 'daily' });
  assert.deepEqual(JSON.parse(JSON.stringify(scenario.requests)), [{ id: 7, patch: { completed: true } }]);
  assert.equal(scenario.alerts.length, 1);
  assert.equal(scenario.alerts[0].title, 'Выполнено');
  assert.equal(scenario.alerts[0].description, `Следующий повтор — ${tomorrow}`);
});

test('completing an ordinary task confirms it with «Задача выполнена»', async () => {
  const scenario = harness({ ok: true, data: { id: 8, completed: true, scheduled_at: null } });
  await scenario.hook.toggleComplete({ id: 8, completed: false, scheduled_at: null });
  assert.deepEqual(scenario.alerts.map((alert) => alert.title), ['Задача выполнена']);
});

test('reopening a task shows no notice', async () => {
  const scenario = harness({ ok: true, data: { id: 8, completed: false, scheduled_at: null } });
  await scenario.hook.toggleComplete({ id: 8, completed: true, scheduled_at: null });
  assert.equal(scenario.alerts.length, 0);
});

test('a deletion lost to the network offers «Повторить», and the retry closes the card once it succeeds', async () => {
  const responses = [{ ok: false, error: 'Нет соединения с интернетом', network: true }, { ok: true }];
  const scenario = harness(() => responses.shift());
  let closed = 0;
  assert.equal(await scenario.hook.removeTask({ id: 9, title: 'Task' }, () => { closed += 1; }), false);
  assert.equal(scenario.alerts[0].title, 'Не удалось удалить задачу');
  assert.equal(scenario.alerts[0].network, true);
  assert.equal(scenario.invalidations(), 0, 'the lists keep the task');
  scenario.alerts[0].retry();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(scenario.requests, [9, 9]);
  assert.equal(closed, 1);
  assert.equal(scenario.invalidations(), 1);
});
