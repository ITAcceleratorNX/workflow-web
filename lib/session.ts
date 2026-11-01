import { API_BASE_URL } from "@/lib/api-base-url";
import { createSession } from "@/lib/session-core";
import { useAuthStore } from "@/stores/useAuthStore";

const LOCK_NAME = "workflow-auth-session";

/** Сессия входа сайта: токены лежат в auth-store (localStorage), вкладки продлевают её по очереди. */
const session = createSession({
    apiBaseUrl: API_BASE_URL,
    fetch: (url, init) => fetch(url, init),
    exclusive: (work) =>
        typeof navigator !== "undefined" && navigator.locks
            ? navigator.locks.request(LOCK_NAME, work)
            : work(),
    store: {
        read: () => {
            const { token, refreshToken, isGuest } = useAuthStore.getState();
            // Демо-вход не настоящий: продлевать нечего.
            return isGuest ? { token: null, refreshToken: null } : { token, refreshToken };
        },
        save: ({ token, refreshToken }) => useAuthStore.getState().setTokens(token, refreshToken),
        end: () => {
            useAuthStore.getState().clearAuth();
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        },
        sync: async () => {
            await useAuthStore.persist.rehydrate();
        },
    },
});

if (typeof window !== "undefined") {
    // Другая вкладка продлила сессию или вышла: память этой вкладки догоняет localStorage.
    window.addEventListener("storage", (event) => {
        if (event.key === useAuthStore.persist.getOptions().name) void useAuthStore.persist.rehydrate();
    });
}

/** Токен для запроса к API: продлённый, если старый истекает. В демо-режиме — 'guest-demo'. */
export async function getAccessToken(): Promise<string | null> {
    const { isGuest, token } = useAuthStore.getState();
    if (isGuest) return token;
    return session.accessToken();
}

/**
 * Сервер ответил 401 на запрос с `usedToken`: продлевает сессию. Вернёт токен для повтора запроса
 * или null; `ended` — сессия завершена и пользователь уже уходит на экран входа.
 */
export function renewAfterUnauthorized(usedToken: string) {
    return session.afterUnauthorized(usedToken);
}

/** Ручной выход: завершает сессию на сервере и выходит на устройстве. */
export async function signOut(): Promise<void> {
    const { refreshToken } = useAuthStore.getState();
    useAuthStore.getState().clearAuth();
    await session.signOutOnServer(refreshToken);
}
