"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ManagerHomeDesktop } from "./manager-home-desktop";
import { ManagerHomeDashboard } from "./manager-home-dashboard";

/** «Обзор» и «Аналитика» на мобилке дублировали «Статистику» — ведём туда. */
const MOBILE_STATISTICS_TABS = new Set(["overview", "analytics"]);

export function ManagerHomeView() {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const tab = useSearchParams().get("tab");
  const toStatistics = !isDesktop && tab != null && MOBILE_STATISTICS_TABS.has(tab);

  useEffect(() => {
    if (toStatistics) router.replace("/manager/statistics");
  }, [toStatistics, router]);

  if (isDesktop) {
    return <ManagerHomeDesktop />;
  }
  if (toStatistics) return null;
  return <ManagerHomeDashboard />;
}
