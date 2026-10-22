import api from "@/lib/api";

/** Состояние подключений внешних календарей (GET /calendar-integrations). */
export interface TaskCalendarStatus {
  google: {
    /** Google Календарь настроен на сервере. */
    available: boolean;
    connected: boolean;
    status: "active" | "error" | "revoked" | null;
    account_email: string | null;
    last_synced_at: string | null;
    last_error: string | null;
  };
  ics: {
    enabled: boolean;
    feed_url: string | null;
    webcal_url: string | null;
  };
}

export interface TaskCalendarLink {
  enabled: true;
  feed_url: string;
  webcal_url: string;
}

export async function getTaskCalendarStatus(): Promise<TaskCalendarStatus> {
  const { data } = await api.get<TaskCalendarStatus>("/calendar-integrations");
  return data;
}

/** Адрес страницы согласия Google; после неё сервер вернёт на /settings/calendar. */
export async function getGoogleCalendarAuthUrl(): Promise<string> {
  const { data } = await api.post<{ url: string }>("/calendar-integrations/google/auth-url", { return_to: "web" });
  return data.url;
}

export async function syncGoogleCalendar(): Promise<{ ok: boolean; last_error: string | null }> {
  const { data } = await api.post("/calendar-integrations/google/sync");
  return data;
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await api.delete("/calendar-integrations/google");
}

/** Включает подписку; rotate — выпустить новую ссылку, старая перестанет работать. */
export async function enableCalendarSubscription(rotate = false): Promise<TaskCalendarLink> {
  const { data } = await api.post<TaskCalendarLink>("/calendar-integrations/ics", { rotate });
  return data;
}

export async function disableCalendarSubscription(): Promise<void> {
  await api.delete("/calendar-integrations/ics");
}
