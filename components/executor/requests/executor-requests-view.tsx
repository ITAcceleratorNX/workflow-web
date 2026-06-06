"use client";

import { useExecutorRequestsList } from "@/hooks/use-executor-requests-list";
import { ExecutorRequestsDesktop } from "./executor-requests-desktop";
import { ExecutorRequestsMobile } from "./executor-requests-mobile";

export function ExecutorRequestsView() {
  const state = useExecutorRequestsList();

  if (state.isDesktop) {
    return <ExecutorRequestsDesktop {...state} />;
  }

  return <ExecutorRequestsMobile {...state} />;
}
