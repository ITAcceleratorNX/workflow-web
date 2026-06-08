"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { ManagerHomeDesktop } from "./manager-home-desktop";
import { ManagerHomeDashboard } from "./manager-home-dashboard";

export function ManagerHomeView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return <ManagerHomeDesktop />;
  }
  return <ManagerHomeDashboard />;
}
