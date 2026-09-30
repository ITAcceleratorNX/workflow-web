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
      deleteUserTask: async (id) => { requests.push(id); return result; },
      updateUserTask: async (id, patch) => { requests.push({ id, patch }); return result; },
    },
    '@/lib/task-recurrence': {},
    '@/lib/group-task-completion': {},
    '@/lib/task-recipients-api': {},
    '@/stores/useAuthStore': { useAuthStore: (select) => select(auth) },
    '@/stores/user-tasks-invalidate-store': { useUserTasksInvalidateStore: (select) => select(state) },
    '@/hooks/use-toast': { useToast: () => ({ toast: (message) => alerts.push(message) }) },
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
