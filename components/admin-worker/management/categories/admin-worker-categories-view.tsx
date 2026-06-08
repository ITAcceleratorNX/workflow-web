"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { AdminWorkerCategoriesDesktop } from "./admin-worker-categories-desktop";
import { AdminWorkerCategoriesMobile } from "./admin-worker-categories-mobile";

export function AdminWorkerCategoriesView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <AdminWorkerCategoriesDesktop />;
  return <AdminWorkerCategoriesMobile />;
}
