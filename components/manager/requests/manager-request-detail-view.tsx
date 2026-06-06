"use client";

import { useManagerRequestDetail } from "@/hooks/use-manager-request-detail";
import { ManagerRequestDetailMobile } from "./manager-request-detail-mobile";

export function ManagerRequestDetailView() {
  const state = useManagerRequestDetail();

  if (state.isDesktop) {
    return null;
  }

  return <ManagerRequestDetailMobile {...state} />;
}
