"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { ClientHealthDesktopView } from "./client-health-desktop-view";
import { ClientHealthMobileView } from "./client-health-mobile-view";

export function ClientHealthView() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <ClientHealthDesktopView />;
  }

  return <ClientHealthMobileView />;
}
