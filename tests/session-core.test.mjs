import assert from 'node:assert/strict';
import test from 'node:test';
import { createSession, tokenExpiresAt } from '../lib/session-core.ts';

const NOW = 1_800_000_000_000;

/** JWT без подписи: клиент читает только exp. */
const jwt = (claims) => {
  const part = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  return `${part({ alg: 'HS256' })}.${part(claims)}.sig`;
};
const sessionToken = (sid, minutesLeft) => jwt({ id: 1, sid, exp: (NOW + minutesLeft * 60_000) / 1000 });
const json = (status, body) => new Response(JSON.stringify(body), { status });

/** Вкладка: своя память стора поверх общего localStorage. */
function tab(shared, respond, exclusive) {
  let memory = { ...shared.value };
  let ended = 0;
  const calls = [];
  const session = createSession({
    apiBaseUrl: 'https://api.test',
    now: () => NOW,
    exclusive,
    store: {
      read: () => memory,
      save: (tokens) => { memory = { ...tokens }; shared.value = { ...tokens }; },
      end: () => { ended += 1; memory = { token: null, refreshToken: null }; shared.value = memory; },
      sync: async () => { memory = { ...shared.value }; },
    },
    fetch: async (url, init) => {
      calls.push([url, JSON.parse(String(init.body))]);
      return respond(url, init);
    },
  });
  return { session, calls, memory: () => memory, ended: () => ended };
}

/** Web Locks в одной вкладке-процессе: работы идут строго по очереди. */
function queueLock() {
  let tail = Promise.resolve();
  return (work) => {
    const run = tail.then(work);
    tail = run.catch(() => {});
    return run;
  };
}

test('reads the expiry of a JWT and nothing from other strings', () => {
  assert.equal(tokenExpiresAt(sessionToken(1, 10)), NOW + 10 * 60_000);
  assert.equal(tokenExpiresAt('guest-demo'), null);
});

test('two tabs with the same expiring token renew the session once, and both get the new token', async () => {
  const shared = { value: { token: sessionToken(1, 0.5), refreshToken: 'r1' } };
  let issued = 0;
  const respond = async () => {
    issued += 1;
    return json(200, { token: sessionToken(1, 15), refresh_token: `r${issued + 1}` });
  };
  const lock = queueLock();
  const a = tab(shared, respond, lock);
  const b = tab(shared, respond, lock);
  const [ta, tb] = await Promise.all([a.session.accessToken(), b.session.accessToken()]);
  assert.equal(issued, 1, 'The second tab takes the token the first one got');
  assert.equal(ta, tb);
  assert.deepEqual(b.memory(), shared.value);
  assert.deepEqual(shared.value.refreshToken, 'r2');
});

test('a 401 retries with the token another request has already renewed', async () => {
  const fresh = sessionToken(1, 15);
  const t = tab({ value: { token: fresh, refreshToken: 'r2' } }, () => assert.fail('no request expected'));
  assert.deepEqual(await t.session.afterUnauthorized(sessionToken(1, -1)), { token: fresh, ended: false });
});

test('signs out when the server ended the session, stays signed in while it is unreachable', async () => {
  const token = sessionToken(1, -1);
  const ended = tab({ value: { token, refreshToken: 'r1' } }, () => json(401, { code: 'SESSION_INVALID' }));
  assert.deepEqual(await ended.session.afterUnauthorized(token), { token: null, ended: true });
  assert.equal(ended.ended(), 1);

  const offline = tab({ value: { token, refreshToken: 'r1' } }, () => Promise.reject(new TypeError('Failed to fetch')));
  assert.deepEqual(await offline.session.afterUnauthorized(token), { token: null, ended: false });
  assert.equal(offline.ended(), 0);
  assert.deepEqual(offline.memory(), { token, refreshToken: 'r1' });
});

test('moves a sign-in from before sessions to a session, and ends it on the server at sign-out', async () => {
  const legacy = jwt({ id: 1, exp: (NOW + 60 * 60_000) / 1000 });
  const renewed = sessionToken(4, 15);
  const t = tab({ value: { token: legacy, refreshToken: null } }, () => json(200, { token: renewed, refresh_token: 'r1' }));
  assert.equal(await t.session.accessToken(), renewed);
  await t.session.signOutOnServer('r1');
  assert.deepEqual(t.calls, [
    ['https://api.test/auth/session', {}],
    ['https://api.test/auth/logout', { refresh_token: 'r1' }],
  ]);
});

test('does not ask again with every request while the server cannot renew', async () => {
  const legacy = jwt({ id: 1, exp: (NOW + 60 * 60_000) / 1000 });
  const t = tab({ value: { token: legacy, refreshToken: null } }, () => json(404, {}));
  assert.equal(await t.session.accessToken(), legacy);
  assert.equal(await t.session.accessToken(), legacy);
  assert.equal(t.calls.length, 1);
});
