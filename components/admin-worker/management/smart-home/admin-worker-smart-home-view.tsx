"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { AdminWorkerSmartHomeDesktop } from "./admin-worker-smart-home-desktop";
import { AdminWorkerSmartHomeMobile } from "./admin-worker-smart-home-mobile";

export function AdminWorkerSmartHomeView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <AdminWorkerSmartHomeDesktop />;
  return <AdminWorkerSmartHomeMobile />;
}
