import axios from "axios";

import api from "@/lib/api";
import { failureFromResponse, type RequestFailure } from "@/lib/api-errors";
import { createTaskCommentsApi, type Transport } from "@/lib/task-comments/api";

/**
 * Транспорт API комментариев поверх общего axios-клиента: тот же адрес, токен и выход при 401.
 * Ошибку отдаёт в форме RequestFailure — с кодом, ошибками полей и Retry-After, как мобильный `request`.
 */
const transport: Transport = async <T,>(
  path: string,
  init: { method?: "POST" | "PATCH" | "DELETE"; params?: Record<string, string>; body?: string; signal: AbortSignal },
): Promise<{ ok: true; data: T } | RequestFailure> => {
  try {
    const res = await api.request<T>({
      url: path,
      method: init.method ?? "GET",
      params: init.params,
      data: init.body,
      signal: init.signal,
    });
    return { ok: true, data: res.data };
  } catch (error) {
    if (axios.isCancel(error) || init.signal.aborted) {
      return { ok: false, error: "Запрос отменён", aborted: true };
    }
    if (axios.isAxiosError(error) && error.response) {
      const retryAfter = error.response.headers?.["retry-after"];
      return failureFromResponse(
        error.response.status,
        error.response.data,
        typeof retryAfter === "string" ? retryAfter : null,
      );
    }
    return { ok: false, error: "Нет соединения с сервером" };
  }
};

export const userTaskCommentsApi = createTaskCommentsApi(transport);
