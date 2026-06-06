"use client";

import { BottomNav } from "@/components/BottomNav";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useManagerStatisticsMobilePage } from "@/hooks/use-manager-statistics-mobile-page";
import { ManagerStatisticsDesktopView } from "./manager-statistics-desktop-view";
import { ManagerStatisticsMobileView } from "./manager-statistics-mobile-view";

export function ManagerStatisticsView() {
  const isDesktop = useIsDesktop();
  const mobileState = useManagerStatisticsMobilePage();

  if (isDesktop) {
    return <ManagerStatisticsDesktopView />;
  }

  return (
    <>
      <ManagerStatisticsMobileView {...mobileState} />
      <BottomNav activeTab="statistics" />
    </>
  );
}
