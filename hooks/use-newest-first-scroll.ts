"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Лента «новые сверху»: при входе прокручена к самому новому уведомлению,
 * у нижнего края догружает более ранние (они добавляются в конец и ничего не сдвигают).
 */
export function useNewestFirstScroll({
  resetKey,
  itemsCount,
  hasMore,
  loading,
  onLoadOlder,
}: {
  /** Смена ленты (категории) снова поднимает её к началу. */
  resetKey: string | null;
  itemsCount: number;
  hasMore: boolean;
  loading: boolean;
  onLoadOlder: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = 0;
  }, [resetKey]);

  const loadOlder = useCallback(() => {
    if (!hasMore || loading) return;
    onLoadOlder();
  }, [hasMore, loading, onLoadOlder]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadOlder();
  }, [loadOlder]);

  // Короткая первая страница не даёт прокрутки: догружаем, пока лента не заполнит экран.
  useEffect(() => {
    const el = containerRef.current;
    if (el && itemsCount > 0 && el.scrollHeight <= el.clientHeight) loadOlder();
  }, [itemsCount, loadOlder]);

  return { containerRef, onScroll };
}
