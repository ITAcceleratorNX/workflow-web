import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
import ts from 'typescript';
import { completeAuthHydration } from '../lib/auth-hydration.ts';

const savedAuth = { user: { id: 7 }, token: 'test-token', role: 'client' };
const serialized = JSON.stringify({ state: savedAuth, version: 0 });
const emptyAuth = () => ({ user: null, token: null, role: null });
const storage = (getItem) => ({ getItem, setItem() {}, removeItem() {} });
const authStore = (getItem, skipHydration = false) => createStore(persist(emptyAuth, {
  name: 'auth-storage', storage: createJSONStorage(() => storage(getItem)), skipHydration,
}));

test('already restored auth keeps its client state despite Zustand’s empty hydration snapshot', async () => {
  let reads = 0;
  const store = authStore(() => { reads++; return serialized; });
  assert.equal(store.getInitialState().user, null);
  assert.deepEqual(store.getState(), savedAuth);
  await completeAuthHydration(store.persist);
  assert.equal(reads, 1, 'do not reread storage and replace a newer live session');
  assert.deepEqual(store.getState(), savedAuth);
});

test('route initialization waits for delayed persistence to supply the logged-in account', async () => {
  let resolveStorage;
  const pendingStorage = new Promise((resolve) => { resolveStorage = resolve; });
  const store = authStore(() => pendingStorage, true);
  let ready = false;
  const completion = completeAuthHydration(store.persist).then(() => { ready = true; });
  await Promise.resolve();
  assert.equal(ready, false);
  assert.equal(store.getState().user, null);
  resolveStorage(serialized);
  await completion;
  assert.equal(ready, true);
  assert.deepEqual(store.getState(), savedAuth);
});

test('missing, corrupt and blocked storage finish initialization instead of trapping the app', async () => {
  for (const getItem of [() => null, () => '{broken JSON', () => { throw new Error('Storage blocked'); }]) {
    const store = authStore(getItem, true);
    await completeAuthHydration(store.persist);
    assert.deepEqual(store.getState(), emptyAuth());
  }
  await completeAuthHydration(undefined); // Zustand omits persist if storage cannot be created.
  await completeAuthHydration({ hasHydrated: () => false, rehydrate: () => Promise.reject(new Error('Storage denied')) });
});

test('server markup defers protected descendants even with saved auth', async () => {
  const require = createRequire(import.meta.url);
  const store = authStore(() => serialized);
  const source = await readFile(new URL('../components/auth-hydration-boundary.tsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, {
    module: loaded, exports: loaded.exports,
    require: (id) => id === '@/lib/auth-hydration' ? { completeAuthHydration }
      : id === '@/stores/useAuthStore' ? { useAuthStore: store } : require(id),
  });
  let protectedRenders = 0;
  const ProtectedRoute = () => { protectedRenders++; return React.createElement('div', null, 'Protected route'); };
  const tree = React.createElement(loaded.exports.AuthHydrationBoundary, null, React.createElement(ProtectedRoute));
  assert.equal(renderToString(tree), '');
  assert.equal(protectedRenders, 0, 'guards must not see the empty getInitialState snapshot');
});
