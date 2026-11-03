import axios from "axios";

import api from "@/lib/api";
import { failureFromResponse, type RequestFailure } from "@/lib/api-errors";

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestInit {
  method?: ApiMethod;
  params?: Record<string, string>;
  /** JSON body: an object, or a string already serialized. */
  body?: unknown;
  signal?: AbortSignal;
}

export type ApiResponse<T> = { ok: true; data: T } | RequestFailure;

export type ApiTransport = <T>(path: string, init?: ApiRequestInit) => Promise<ApiResponse<T>>;

/**
 * Транспорт поверх общего axios-клиента: тот же адрес, токен и выход при 401. Ошибку отдаёт в форме
 * RequestFailure — с кодом, ошибками полей и Retry-After, как мобильный `request`. Модули API
 * (комментарии, опросы) получают его параметром и остаются чистыми для тестов.
 */
export const apiTransport: ApiTransport = async <T,>(path: string, init: ApiRequestInit = {}) => {
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
    if (axios.isCancel(error) || init.signal?.aborted) {
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
