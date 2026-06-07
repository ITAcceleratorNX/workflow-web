"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";

export type PullToRefreshProps = {
  children?: React.ReactNode;
  onRefresh?: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  /** @deprecated используйте variant overlay через PageLoader */
  color?: string;
  /** Минимальное время показа лоадера после refresh (ms), как в mobile */
  minVisibleMs?: number;
  loaderSize?: number;
};

export function PullToRefresh(props: PullToRefreshProps) {
  const {
    children,
    onRefresh = async () => {
      await new Promise((r) => setTimeout(r, 1000));
    },
    threshold = 96,
    maxPull = 180,
    minVisibleMs = 1200,
    loaderSize = 56,
  } = props;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const startYRef = React.useRef<number>(0);
  const pullingRef = React.useRef<boolean>(false);
  const refreshStartedAtRef = React.useRef<number | null>(null);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pull, setPull] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const [animatingBack, setAnimatingBack] = React.useState(false);
  const [showLoader, setShowLoader] = React.useState(false);

  const rubber = React.useCallback((x: number, max: number) => {
    const resistance = 0.6;
    const result = (x * resistance * max) / (x * resistance + max);
    return Math.max(0, Math.min(result, max));
  }, []);

  const progress = Math.max(0, Math.min(1, pull / threshold));
  const loaderScale = 0.3 + progress * 0.7;
  const loaderOpacity = refreshing ? 1 : Math.max(progress, 0.12);

  const reset = React.useCallback(() => {
    setAnimatingBack(true);
    setPull(0);
    const t = setTimeout(() => {
      setAnimatingBack(false);
      setShowLoader(false);
    }, 220);
    return () => clearTimeout(t);
  }, []);

  const finishRefresh = React.useCallback(() => {
    const startedAt = refreshStartedAtRef.current;
    const elapsed = startedAt ? Date.now() - startedAt : minVisibleMs;
    const wait = Math.max(minVisibleMs - elapsed, 0);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(() => {
      setRefreshing(false);
      refreshStartedAtRef.current = null;
      reset();
    }, wait);
  }, [minVisibleMs, reset]);

  const doRefresh = React.useCallback(async () => {
    try {
      refreshStartedAtRef.current = Date.now();
      setRefreshing(true);
      setShowLoader(true);
      setPull(threshold);
      await onRefresh();
    } finally {
      finishRefresh();
    }
  }, [finishRefresh, onRefresh, threshold]);

  const onPointerDown = React.useCallback(
    (e: PointerEvent) => {
      if (refreshing) return;
      const target = containerRef.current;
      if (!target) return;

      const isPrimary = e.isPrimary !== false && e.button === 0;
      if (!isPrimary) return;

      if (target.scrollTop <= 0) {
        pullingRef.current = true;
        startYRef.current = e.clientY;
      }
    },
    [refreshing]
  );

  const onPointerMove = React.useCallback(
    (e: PointerEvent) => {
      if (!pullingRef.current || refreshing) return;

      const dy = e.clientY - startYRef.current;
      const atTop = containerRef.current?.scrollTop === 0;

      if (dy > 0 && atTop) {
        e.preventDefault();
        const nextPull = rubber(dy, maxPull);
        setPull(nextPull);
        setShowLoader(nextPull > threshold * 0.02);
      } else {
        pullingRef.current = false;
        setPull(0);
        setShowLoader(false);
      }
    },
    [maxPull, refreshing, rubber, threshold]
  );

  const onPointerUp = React.useCallback(() => {
    if (!pullingRef.current || refreshing) return;
    pullingRef.current = false;

    if (pull >= threshold) {
      void doRefresh();
    } else {
      reset();
    }
  }, [doRefresh, pull, refreshing, reset, threshold]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const down = (e: Event) => onPointerDown(e as PointerEvent);
    const move = (e: Event) => onPointerMove(e as PointerEvent);
    const up = () => onPointerUp();

    el.addEventListener("pointerdown", down, { passive: true });
    el.addEventListener("pointermove", move as EventListener, { passive: false });
    el.addEventListener("pointerup", up, { passive: true });
    el.addEventListener("pointercancel", up, { passive: true });
    el.addEventListener("pointerleave", up, { passive: true });

    const touchmove = (e: TouchEvent) => {
      const atTop = containerRef.current?.scrollTop === 0;
      if (pullingRef.current && !refreshing && atTop) {
        e.preventDefault();
      }
    };
    el.addEventListener("touchmove", touchmove, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move as EventListener);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerleave", up);
      el.removeEventListener("touchmove", touchmove);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [onPointerDown, onPointerMove, onPointerUp, refreshing]);

  const contentTranslateY = refreshing ? threshold : pull;

  return (
    <div
      ref={containerRef}
      className="relative min-h-full h-[calc(100vh_-_theme(spacing.14))] sm:h-[calc(100vh_-_theme(spacing.16))] overflow-y-auto overscroll-contain bg-inherit"
      role="region"
      aria-label="Лента"
      style={{
        WebkitOverflowScrolling: "touch",
        scrollBehavior: "auto",
        contain: "layout style paint",
      }}
    >
      <div
        className="pointer-events-none sticky top-0 z-10 flex items-end justify-center bg-transparent"
        style={{
          height: `${contentTranslateY}px`,
          transition: animatingBack ? "height 220ms ease" : undefined,
        }}
        aria-hidden={!showLoader && !refreshing}
      >
        {(showLoader || refreshing) && (
          <div className="pb-2">
            <PageLoader
              size={loaderSize}
              variant="overlay"
              style={{
                transform: `scale(${refreshing ? 1 : loaderScale})`,
                opacity: loaderOpacity,
                transition: refreshing
                  ? "transform 200ms ease, opacity 200ms ease"
                  : "transform 120ms ease, opacity 120ms ease",
              }}
              className={cn(refreshing && "animate-pulse")}
            />
          </div>
        )}
      </div>

      <div
        style={{
          transform: `translateY(${contentTranslateY}px)`,
          transition: animatingBack ? "transform 220ms ease" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;
