"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDaysToDateKey, getTodayAppDateISO } from "@/lib/dateTimeUtils";
import { getFallbackNewsItems, getNewsAll, getNewsById, type NewsDisplayItem } from "@/lib/news-api";
import {
  emptyReactionCounts,
  type NewsReactionCounts,
  type NewsReactionKind,
} from "@/lib/news-reactions";
import type { NewsDateFilter } from "@/constants/news-filters";

export function useClientNewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState<NewsDateFilter>("all");
  const [newsList, setNewsList] = useState<NewsDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getNewsAll().then((res) => {
      if (cancelled) return;
      if (res.ok) setNewsList(res.data);
      else setNewsList(getFallbackNewsItems());
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const todayKey = getTodayAppDateISO();

  const filteredItems = useMemo(() => {
    let list = newsList;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.tag.toLowerCase().includes(q),
      );
    }
    if (filterDate === "today") {
      list = list.filter((item) => item.date === todayKey);
    } else if (filterDate === "week") {
      const weekKey = addDaysToDateKey(todayKey, -7);
      list = list.filter((item) => item.date && item.date >= weekKey && item.date <= todayKey);
    } else if (filterDate === "month") {
      const monthKey = addDaysToDateKey(todayKey, -30);
      list = list.filter((item) => item.date && item.date >= monthKey && item.date <= todayKey);
    }
    return list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [searchQuery, filterDate, todayKey, newsList]);

  const patchNewsEngagement = useCallback(
    (
      newsId: string,
      patch: { reaction_counts: NewsReactionCounts; my_reaction: NewsReactionKind | null },
    ) => {
      setNewsList((list) =>
        list.map((item) => (item.id === newsId ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  return {
    searchQuery,
    setSearchQuery,
    filterDate,
    setFilterDate,
    filteredItems,
    loading,
    patchNewsEngagement,
  };
}

export type UseClientNewsPageResult = ReturnType<typeof useClientNewsPage>;

export function useClientNewsDetailPage(newsId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<NewsDisplayItem | null>(null);

  const load = useCallback(async () => {
    if (!newsId) return;
    const numericId = Number(newsId);
    if (!Number.isFinite(numericId)) {
      setError("Новость не найдена");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await getNewsById(numericId);
    if (!result.ok) {
      setError(result.error);
      setItem(null);
    } else {
      setItem({
        ...result.data,
        reaction_counts: result.data.reaction_counts ?? emptyReactionCounts(),
      });
    }
    setLoading(false);
  }, [newsId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, error, item, setItem, reload: load };
}
