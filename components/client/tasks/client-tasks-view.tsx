"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { useClientTasksPage } from "@/hooks/use-client-tasks-page";
import { ClientTasksDesktopView } from "./client-tasks-desktop-view";
import { ClientTasksMobileView } from "./client-tasks-mobile-view";

export function ClientTasksView() {
  const isDesktop = useIsDesktop();
  const state = useClientTasksPage();

  if (isDesktop) {
    return <ClientTasksDesktopView {...state} />;
  }

  return <ClientTasksMobileView {...state} />;
}
