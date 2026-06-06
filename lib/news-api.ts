import api from "@/lib/api";
import { NEWS_ITEMS, type NewsItem } from "@/constants/news";

export type NewsDisplayItem = NewsItem;

function toDisplayItem(item: {
  id: number | string;
  title: string;
  content?: string;
  image_url?: string | null;
  image?: string | null;
  published_at?: string;
}): NewsDisplayItem {
  return {
    id: String(item.id),
    tag: "Новость",
    title: item.title,
    desc: item.content ?? "",
    image: item.image_url ?? item.image ?? "",
    date: item.published_at?.slice(0, 10),
  };
}

export function getFallbackNewsItems(): NewsDisplayItem[] {
  return NEWS_ITEMS.map((item) => ({ ...item }));
}

export async function getNewsMain(): Promise<
  { ok: true; data: NewsDisplayItem[] } | { ok: false; error: string }
> {
  try {
    const res = await api.get("/news/main");
    const raw = res.data?.news ?? res.data ?? [];
    const items = Array.isArray(raw) ? raw.map(toDisplayItem) : [];
    return { ok: true, data: items };
  } catch {
    return { ok: false, error: "Не удалось загрузить новости" };
  }
}
