import api from "@/lib/api";
import { NEWS_ITEMS, type NewsItem } from "@/constants/news";
import {
  emptyReactionCounts,
  normalizeReactionCounts,
  type NewsReactionKind,
} from "@/lib/news-reactions";

export interface NewsDisplayItem extends NewsItem {
  view_count?: number;
  reaction_counts?: ReturnType<typeof emptyReactionCounts>;
  my_reaction?: NewsReactionKind | null;
}

interface ApiNewsItem {
  id: number;
  title: string;
  content: string;
  status?: string;
  image_url?: string | null;
  image?: string | null;
  published_at?: string;
  created_at?: string;
  view_count?: number;
  reaction_counts?: Partial<Record<NewsReactionKind, number>> | null;
  my_reaction?: NewsReactionKind | null;
}

function toDisplayItem(item: ApiNewsItem): NewsDisplayItem {
  const publishedRaw = item.published_at ?? "";
  const date = publishedRaw
    ? publishedRaw.slice(0, 10)
    : item.created_at?.slice(0, 10) ?? "";
  return {
    id: String(item.id),
    tag: "Новость",
    title: item.title,
    desc: item.content ?? "",
    image: item.image_url ?? item.image ?? "",
    date,
    view_count: item.view_count ?? 0,
    reaction_counts: normalizeReactionCounts(item.reaction_counts),
    my_reaction: item.my_reaction ?? null,
  };
}

export function getFallbackNewsItems(): NewsDisplayItem[] {
  return NEWS_ITEMS.map((item) => ({
    ...item,
    view_count: 0,
    reaction_counts: emptyReactionCounts(),
    my_reaction: null,
  }));
}

async function fetchNewsList(
  path: string,
): Promise<{ ok: true; data: NewsDisplayItem[] } | { ok: false; error: string }> {
  try {
    const res = await api.get(path);
    const raw = res.data?.news ?? res.data ?? [];
    const items = Array.isArray(raw) ? raw.map((item: ApiNewsItem) => toDisplayItem(item)) : [];
    return { ok: true, data: items };
  } catch {
    return { ok: false, error: "Не удалось загрузить новости" };
  }
}

export async function getNewsMain(): Promise<
  { ok: true; data: NewsDisplayItem[] } | { ok: false; error: string }
> {
  return fetchNewsList("/news/main");
}

export async function getNewsAll(): Promise<
  { ok: true; data: NewsDisplayItem[] } | { ok: false; error: string }
> {
  return fetchNewsList("/news/all");
}

export async function getNewsById(
  id: number,
): Promise<{ ok: true; data: NewsDisplayItem } | { ok: false; error: string }> {
  try {
    const res = await api.get<ApiNewsItem>(`/news/${id}`);
    return { ok: true, data: toDisplayItem(res.data) };
  } catch {
    return { ok: false, error: "Новость не найдена" };
  }
}

export async function recordNewsView(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.post(`/news/${id}/view`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось засчитать просмотр" };
  }
}

export async function setNewsReaction(
  id: number,
  reaction: NewsReactionKind,
): Promise<{ ok: true; data: ApiNewsItem } | { ok: false; error: string }> {
  try {
    const res = await api.put<ApiNewsItem>(`/news/${id}/reaction`, { reaction });
    return { ok: true, data: res.data };
  } catch {
    return { ok: false, error: "Не удалось поставить реакцию" };
  }
}
