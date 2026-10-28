"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Лента «новые внизу»: при входе прокручена к последнему уведомлению, у верхнего края
 * догружает более ранние и сохраняет положение, чтобы прочитанное не уезжало из-под пальца.
 */
export function useBottomAnchoredScroll({
  resetKey,
  itemsCount,
  hasMore,
  loading,
  onLoadOlder,
}: {
  /** Смена ленты (категории) снова прижимает её к низу. */
  resetKey: string | null;
  itemsCount: number;
  hasMore: boolean;
  loading: boolean;
  onLoadOlder: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const beforePrepend = useRef<{ height: number; top: number } | null>(null);

  useLayoutEffect(() => {
    stickToBottom.current = true;
    beforePrepend.current = null;
  }, [resetKey]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || itemsCount === 0) return;
    if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
      stickToBottom.current = false;
    } else if (beforePrepend.current) {
      const { height, top } = beforePrepend.current;
      el.scrollTop = el.scrollHeight - height + top;
      beforePrepend.current = null;
    }
  }, [itemsCount, resetKey]);

  const loadOlder = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasMore || loading) return;
    beforePrepend.current = { height: el.scrollHeight, top: el.scrollTop };
    onLoadOlder();
  }, [hasMore, loading, onLoadOlder]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (el && el.scrollTop < 80) loadOlder();
  }, [loadOlder]);

  // Короткая первая страница не даёт прокрутки: догружаем, пока лента не заполнит экран.
  useEffect(() => {
    const el = containerRef.current;
    if (el && itemsCount > 0 && el.scrollHeight <= el.clientHeight) loadOlder();
  }, [itemsCount, loadOlder]);

  return { containerRef, onScroll };
}
