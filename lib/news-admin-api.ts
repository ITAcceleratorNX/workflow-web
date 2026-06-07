import api from "@/lib/api";
import {
  normalizeReactionCounts,
  type NewsReactionKind,
} from "@/lib/news-reactions";

function extractError(error: unknown): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== "object") return "Ошибка запроса";
  const d = data as Record<string, unknown>;
  if (typeof d.error === "string") return d.error;
  if (typeof d.message === "string") return d.message;
  if (Array.isArray(d.details)) {
    const first = d.details[0] as { message?: string } | undefined;
    if (first?.message) return first.message;
  }
  return "Ошибка запроса";
}

export interface ApiNewsItem {
  id: number;
  title: string;
  content: string;
  status: "active" | "hidden" | "archived" | "scheduled";
  image_url?: string | null;
  image?: string | null;
  published_at: string;
  created_at?: string;
  view_count?: number;
  reaction_counts?: Partial<Record<NewsReactionKind, number>> | null;
  my_reaction?: NewsReactionKind | null;
}

export interface AdminNewsDisplayItem {
  id: string;
  tag: string;
  title: string;
  desc: string;
  image: string;
  date?: string;
  publishedAtIso?: string;
  status?: "active" | "hidden" | "archived" | "scheduled";
  view_count?: number;
  reaction_counts?: ReturnType<typeof normalizeReactionCounts>;
  my_reaction?: NewsReactionKind | null;
}

function toAdminDisplayItem(item: ApiNewsItem): AdminNewsDisplayItem {
  const imageUrl = item.image_url ?? item.image ?? "";
  const publishedRaw = item.published_at ?? "";
  const date = publishedRaw ? publishedRaw.slice(0, 10) : item.created_at?.slice(0, 10) ?? "";
  return {
    id: String(item.id),
    tag: "Новость",
    title: item.title,
    desc: item.content ?? "",
    image: imageUrl,
    date,
    publishedAtIso: publishedRaw || undefined,
    status: item.status,
    view_count: item.view_count ?? 0,
    reaction_counts: normalizeReactionCounts(item.reaction_counts),
    my_reaction: item.my_reaction ?? null,
  };
}

export type NotificationType = "none" | "push_sound" | "push_silent";
export type NewsPublishMode = "now" | "schedule";

export async function getNewsAdminList(
  status?: "active" | "hidden" | "archived" | "scheduled",
): Promise<{ ok: true; data: AdminNewsDisplayItem[] } | { ok: false; error: string }> {
  try {
    const path = status ? `/news/admin/list?status=${status}` : "/news/admin/list";
    const res = await api.get<{ news: ApiNewsItem[] }>(path);
    const items = (res.data?.news ?? []).map(toAdminDisplayItem);
    return { ok: true, data: items };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function hideNews(
  id: number,
): Promise<{ ok: true; data: ApiNewsItem } | { ok: false; error: string }> {
  try {
    const res = await api.patch<ApiNewsItem>(`/news/admin/${id}/hide`);
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function archiveNews(
  id: number,
): Promise<{ ok: true; data: ApiNewsItem } | { ok: false; error: string }> {
  try {
    const res = await api.patch<ApiNewsItem>(`/news/admin/${id}/archive`);
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function unhideNews(
  id: number,
): Promise<{ ok: true; data: ApiNewsItem } | { ok: false; error: string }> {
  try {
    const res = await api.patch<ApiNewsItem>(`/news/admin/${id}/unhide`);
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function deleteNews(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.delete(`/news/admin/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function createNews(params: {
  title: string;
  content: string;
  notification_type?: NotificationType;
  publish_mode?: NewsPublishMode;
  published_at?: string;
  image?: File | null;
}): Promise<{ ok: true; data: ApiNewsItem } | { ok: false; error: string }> {
  try {
    const formData = new FormData();
    formData.append("title", params.title.trim());
    formData.append("content", params.content.trim());
    formData.append("notification_type", params.notification_type ?? "none");
    const mode = params.publish_mode ?? "now";
    formData.append("publish_mode", mode);
    if (mode === "schedule" && params.published_at) {
      formData.append("published_at", params.published_at);
    }
    if (params.image) formData.append("image", params.image);

    const res = await api.post<ApiNewsItem>("/news", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateNews(
  id: number,
  params: {
    title: string;
    content: string;
    notification_type?: NotificationType;
    publish_mode?: NewsPublishMode;
    published_at?: string;
    image?: File | null;
  },
): Promise<{ ok: true; data: ApiNewsItem } | { ok: false; error: string }> {
  try {
    const formData = new FormData();
    formData.append("title", params.title.trim());
    formData.append("content", params.content.trim());
    formData.append("notification_type", params.notification_type ?? "none");
    if (params.publish_mode) {
      formData.append("publish_mode", params.publish_mode);
      if (params.publish_mode === "schedule" && params.published_at) {
        formData.append("published_at", params.published_at);
      }
    }
    if (params.image) formData.append("image", params.image);

    const res = await api.patch<ApiNewsItem>(`/news/admin/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}
