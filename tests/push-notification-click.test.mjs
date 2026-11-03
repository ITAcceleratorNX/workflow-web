import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SOURCE = readFileSync(new URL('../public/firebase-messaging-sw.js', import.meta.url), 'utf8');
const ORIGIN = 'https://workflow.example';
const SURVEY = `${ORIGIN}/client/surveys/3`;

/** The service worker with a fake browser: its handlers and what it asked the browser to do. */
function worker(tabs = []) {
  const handlers = {};
  const calls = [];
  const clients = {
    matchAll: async () => tabs,
    openWindow: async (url) => {
      calls.push(['openWindow', url]);
      return null;
    },
    claim: async () => {
      calls.push(['claim']);
    },
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type, handler) => {
      handlers[type] = handler;
    },
    skipWaiting: () => calls.push(['skipWaiting']),
    registration: { showNotification: async () => {} },
  };
  vm.runInNewContext(SOURCE, { self, clients, URL, console: { log() {}, error() {} } });
  return { handlers, calls };
}

/** An open browser tab; `controlled: false` — a tab this worker does not control yet. */
function tab(url, { focused = false, controlled = true } = {}) {
  const calls = [];
  const client = {
    url,
    focused,
    visibilityState: focused ? 'visible' : 'hidden',
    calls,
    focus: async () => {
      calls.push(['focus']);
      return client;
    },
    navigate: async (next) => {
      if (!controlled) throw new TypeError('This service worker is not the client\'s active service worker.');
      calls.push(['navigate', next]);
      return client;
    },
  };
  return client;
}

/** Clicks a notification with these push data and waits for what the worker does. */
async function click({ handlers }, data) {
  let work;
  let closed = false;
  handlers.notificationclick({
    notification: { data, close: () => { closed = true; } },
    waitUntil: (promise) => { work = promise; },
  });
  await work;
  return closed;
}

test('the push of a survey opens it in a new window when no Workflow tab is open', async () => {
  const sw = worker();
  assert.equal(await click(sw, { type: 'survey_published', survey_id: '3', url: '/client/surveys/3' }), true);
  assert.deepEqual(sw.calls, [['openWindow', SURVEY]]);
});

test('an open Workflow tab comes forward and goes to the survey instead of a new window', async () => {
  const other = tab(`${ORIGIN}/client/tasks`);
  const current = tab(`${ORIGIN}/client`, { focused: true });
  const sw = worker([other, current]);
  await click(sw, { url: '/client/surveys/3' });
  assert.deepEqual(current.calls, [['focus'], ['navigate', SURVEY]]);
  assert.deepEqual(other.calls, []);
  assert.deepEqual(sw.calls, []);
});

test('a tab already showing the survey only comes forward', async () => {
  const survey = tab(SURVEY);
  const sw = worker([tab(`${ORIGIN}/client`, { focused: true }), survey]);
  await click(sw, { url: '/client/surveys/3' });
  assert.deepEqual(survey.calls, [['focus']]);
  assert.deepEqual(sw.calls, []);
});

test('a tab the worker does not control yet cannot be moved: a new window opens', async () => {
  const sw = worker([tab(`${ORIGIN}/client`, { controlled: false })]);
  await click(sw, { url: '/client/surveys/3' });
  assert.deepEqual(sw.calls, [['openWindow', SURVEY]]);
});

test('a push without an address opens the home, and another site never takes the Workflow tab', async () => {
  const home = worker();
  await click(home, {});
  assert.deepEqual(home.calls, [['openWindow', `${ORIGIN}/`]]);

  const app = tab(`${ORIGIN}/client`, { focused: true });
  const elsewhere = worker([app]);
  await click(elsewhere, { url: 'https://other.example/page' });
  assert.deepEqual(elsewhere.calls, [['openWindow', 'https://other.example/page']]);
  assert.deepEqual(app.calls, []);
});

test('a new version of the worker starts at once and takes the open tabs', async () => {
  const sw = worker();
  sw.handlers.install({});
  let activation;
  sw.handlers.activate({ waitUntil: (promise) => { activation = promise; } });
  await activation;
  assert.deepEqual(sw.calls, [['skipWaiting'], ['claim']]);
});
