/** Client endpoints do not support status/type filters: filter only a complete snapshot. */
export async function collectRequestPages<T extends { id: number }>(
  fetchPage: (page: number) => Promise<{ requests: T[]; totalPages: number }>,
): Promise<T[]> {
  const items = new Map<number, T>();
  for (let page = 1; ; page += 1) {
    const result = await fetchPage(page);
    if (!Array.isArray(result.requests) || !Number.isFinite(result.totalPages)) {
      throw new Error("Сервер вернул некорректный список заявок");
    }
    if (result.requests.length === 0) break;
    const previousSize = items.size;
    result.requests.forEach((request) => items.set(request.id, request));
    if (page >= result.totalPages) break;
    if (items.size === previousSize) {
      throw new Error("Не удалось загрузить все заявки. Повторите загрузку");
    }
  }
  return [...items.values()];
}

export function listLoadError(error: unknown): string {
  const failure = error as { response?: { status?: number }; message?: string };
  if (failure?.response?.status === 401) return "Сессия истекла. Войдите в аккаунт снова";
  if (failure?.response?.status === 403) return "Нет доступа к этим данным";
  if (failure?.response?.status === 404) return "Данные недоступны или больше не существуют";
  if (failure?.response?.status && failure.response.status >= 500) {
    return "Сервис временно недоступен. Попробуйте ещё раз";
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "Нет подключения к интернету. Проверьте сеть и повторите загрузку";
  }
  return "Не удалось загрузить данные. Проверьте соединение и попробуйте ещё раз";
}
