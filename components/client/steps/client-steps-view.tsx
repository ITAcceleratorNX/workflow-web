"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { ClientStepsDesktopView } from "./client-steps-desktop-view";
import { ClientStepsMobileView } from "./client-steps-mobile-view";

export function ClientStepsView() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <ClientStepsDesktopView />;
  }

  return <ClientStepsMobileView />;
}
