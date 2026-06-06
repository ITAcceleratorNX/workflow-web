"use client";

import { useManagerRequestsList } from "@/hooks/use-manager-requests-list";
import { ManagerRequestsDesktop } from "./manager-requests-desktop";
import { ManagerRequestsMobile } from "./manager-requests-mobile";

export function ManagerRequestsView() {
  const state = useManagerRequestsList();

  if (state.isDesktop) {
    return <ManagerRequestsDesktop {...state} />;
  }

  return <ManagerRequestsMobile {...state} />;
}
