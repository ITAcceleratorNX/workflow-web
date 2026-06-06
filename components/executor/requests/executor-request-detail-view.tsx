"use client";

import { useExecutorRequestDetail } from "@/hooks/use-executor-request-detail";
import { ExecutorRequestDetailMobile } from "./executor-request-detail-mobile";

export function ExecutorRequestDetailView() {
  const state = useExecutorRequestDetail();

  if (state.isDesktop) {
    return null;
  }

  return <ExecutorRequestDetailMobile {...state} />;
}
