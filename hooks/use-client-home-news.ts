"use client";

import { useCallback, useEffect, useState } from "react";
import { getFallbackNewsItems, getNewsMain, type NewsDisplayItem } from "@/lib/news-api";

export function useClientHomeNews() {
  const [items, setItems] = useState<NewsDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = useCallback(async () => {
    setLoading(true);
    const res = await getNewsMain();
    if (res.ok && res.data.length > 0) {
      setItems(res.data);
    } else {
      setItems(getFallbackNewsItems());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  return { items, loading, refreshNews: loadNews };
}
