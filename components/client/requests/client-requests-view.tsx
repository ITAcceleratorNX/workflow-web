"use client";

import { useClientRequestsList } from "@/hooks/use-client-requests-list";
import { ClientRequestsDesktop } from "./client-requests-desktop";
import { ClientRequestsMobile } from "./client-requests-mobile";

export function ClientRequestsView() {
  const state = useClientRequestsList();

  if (state.isDesktop) {
    return <ClientRequestsDesktop {...state} />;
  }

  return <ClientRequestsMobile {...state} />;
}
