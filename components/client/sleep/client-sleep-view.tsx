"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { ClientSleepDesktopView } from "./client-sleep-desktop-view";
import { ClientSleepMobileView } from "./client-sleep-mobile-view";

export function ClientSleepView() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <ClientSleepDesktopView />;
  }

  return <ClientSleepMobileView />;
}
