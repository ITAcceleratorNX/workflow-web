"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { AdminWorkerNewsDesktop } from "./admin-worker-news-desktop";
import { AdminWorkerNewsMobile } from "./admin-worker-news-mobile";

export function AdminWorkerNewsView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <AdminWorkerNewsDesktop />;
  return <AdminWorkerNewsMobile />;
}
