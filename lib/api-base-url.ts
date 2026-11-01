/** Адрес API. Отдельным модулем, чтобы lib/session.ts не зависел от lib/api.ts (он сам зависит от сессии). */
export const API_BASE_URL =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) ||
    'https://workflow-back-zpk4.onrender.com/api';
