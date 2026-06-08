"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { AdminWorkerLocationCatalogDesktop } from "./admin-worker-location-catalog-desktop";
import { AdminWorkerLocationCatalogMobile } from "./admin-worker-location-catalog-mobile";

export function AdminWorkerLocationCatalogView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <AdminWorkerLocationCatalogDesktop />;
  return <AdminWorkerLocationCatalogMobile />;
}
