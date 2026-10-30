/**
 * Сессия входа: короткий access-токен и refresh-токен, которым клиент сам получает новый
 * access-токен (POST /auth/refresh). Здесь только логика — хранилище, сеть и блокировка между
 * вкладками передаются снаружи, чтобы её можно было проверить в node (lib/session.ts связывает её с приложением).
 */

export interface SessionTokens {
  token: string;
  refreshToken: string;
}

export interface SessionStore {
  /** refreshToken === null — вход до появления сессий (старый токен без продления). */
  read(): { token: string | null; refreshToken: string | null };
  save(tokens: SessionTokens): void;
  /** Сервер завершил сессию: выйти из аккаунта. */
  end(): void;
  /** Перечитать токены из общего хранилища: другая вкладка могла их уже сменить. */
  sync(): Promise<void>;
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Выполняет `work`, пока его не выполняет ни одна другая вкладка (Web Locks). */
export type Exclusive = <T>(work: () => Promise<T>) => Promise<T>;

/**
 * 'renewed' — новые токены сохранены; 'ended' — сервер завершил сессию, пользователь вышел;
 * 'unavailable' — сеть или сервер недоступны: сессия остаётся, попробуем при следующем запросе.
 */
export type RenewOutcome = { kind: 'renewed'; token: string } | { kind: 'ended' } | { kind: 'unavailable' };

/** Токен продлевается заранее, если до конца его жизни меньше этого. */
export const RENEW_BEFORE_MS = 60_000;

/** После неудачного продления (нет сети, сервер недоступен) заранее не продлеваем столько, чтобы не слать его с каждым запросом. */
export const RETRY_AFTER_UNAVAILABLE_MS = 30_000;

function claimsOf(token: string): { exp?: unknown; sid?: unknown } | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')));
  } catch {
    return null;
  }
}

/** Конец жизни JWT (мс от эпохи) или null, если токен не JWT. */
export function tokenExpiresAt(token: string): number | null {
  const exp = claimsOf(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

type Exchange = { kind: 'renewed'; tokens: SessionTokens } | { kind: 'ended' } | { kind: 'unavailable' };

export function createSession({
  apiBaseUrl,
  store,
  fetch,
  exclusive = (work) => work(),
  now = Date.now,
}: {
  apiBaseUrl: string;
  store: SessionStore;
  fetch: FetchLike;
  exclusive?: Exclusive;
  now?: () => number;
}) {
  let inFlight: Promise<RenewOutcome> | null = null;
  let quietUntil = 0;

  const expiring = (token: string) => {
    const expiresAt = tokenExpiresAt(token);
    return expiresAt !== null && expiresAt - now() < RENEW_BEFORE_MS;
  };

  async function exchange(path: string, body: unknown, bearer?: string): Promise<Exchange> {
    let res: Response;
    try {
      res = await fetch(`${apiBaseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
        body: JSON.stringify(body),
      });
    } catch {
      return { kind: 'unavailable' };
    }
    if (res.status === 401) return { kind: 'ended' };
    if (!res.ok) return { kind: 'unavailable' };
    const data = (await res.json().catch(() => ({}))) as { token?: unknown; refresh_token?: unknown };
    if (typeof data.token !== 'string' || typeof data.refresh_token !== 'string') return { kind: 'unavailable' };
    return { kind: 'renewed', tokens: { token: data.token, refreshToken: data.refresh_token } };
  }

  /**
   * Заменяет `stale` новым токеном. Refresh-токен одноразовый: запросы этой вкладки ждут один
   * запрос, вкладки продлевают по очереди, и каждая сначала смотрит, не продлила ли сессию предыдущая.
   */
  function renew(stale: string): Promise<RenewOutcome> {
    if (inFlight) return inFlight;
    inFlight = exclusive(async (): Promise<RenewOutcome> => {
      await store.sync();
      const { token, refreshToken } = store.read();
      if (!token) return { kind: 'ended' };
      if (token !== stale && !expiring(token)) return { kind: 'renewed', token };
      const result = refreshToken
        ? await exchange('/auth/refresh', { refresh_token: refreshToken })
        : await exchange('/auth/session', {}, token);
      // Пока шёл запрос, пользователь мог выйти или войти заново: чужой ответ не применяем.
      const stillOurs = store.read().token === token;
      if (result.kind === 'renewed') {
        if (!stillOurs) return { kind: 'ended' };
        store.save(result.tokens);
        return { kind: 'renewed', token: result.tokens.token };
      }
      if (result.kind === 'ended' && stillOurs) store.end();
      return result;
    }).finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  /** Access-токен для запроса: продлевает заранее, если он вот-вот истечёт. Сеть недоступна — отдаёт текущий. */
  async function accessToken(): Promise<string | null> {
    const { token, refreshToken } = store.read();
    if (!token) return null;
    // Без refresh-токена — вход до появления сессий: переводим на сессию сразу, пока старый токен ещё годен.
    if ((!expiring(token) && refreshToken) || now() < quietUntil) return token;
    const outcome = await renew(token);
    if (outcome.kind === 'unavailable') quietUntil = now() + RETRY_AFTER_UNAVAILABLE_MS;
    if (outcome.kind === 'renewed') return outcome.token;
    return outcome.kind === 'ended' ? null : token;
  }

  /**
   * Сервер ответил 401 на запрос с `usedToken`. Возвращает токен для повтора (null — повторять нечем)
   * и `ended` — завершена ли сессия: тогда пользователь уже вышел.
   */
  async function afterUnauthorized(usedToken: string): Promise<{ token: string | null; ended: boolean }> {
    const current = store.read().token;
    if (!current) return { token: null, ended: true };
    // Другой запрос уже продлил сессию, пока этот летел со старым токеном.
    if (current !== usedToken) return { token: current, ended: false };
    const outcome = await renew(usedToken);
    if (outcome.kind === 'renewed') return { token: outcome.token, ended: false };
    return { token: null, ended: outcome.kind === 'ended' };
  }

  /** Выход: сервер завершает сессию. Ошибка сети выходу на устройстве не мешает. */
  async function signOutOnServer(refreshToken: string | null): Promise<void> {
    if (!refreshToken) return;
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Сессия на сервере истечёт сама.
    }
  }

  return { accessToken, afterUnauthorized, signOutOnServer };
}
