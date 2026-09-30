"use client";

import { useState } from "react";

/** Pagination after filtering a complete server snapshot. */
export function useRequestListWindow<T>(items: T[], filterKey: string) {
  const [window, setWindow] = useState({ key: filterKey, count: 10 });
  const count = window.key === filterKey ? window.count : 10;
  return {
    visibleRequests: items.slice(0, count),
    hasMore: items.length > count,
    loadingMore: false,
    handleLoadMore: () => setWindow({ key: filterKey, count: count + 10 }),
  };
}
