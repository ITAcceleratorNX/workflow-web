"use client";

import { useClientRequestDetail } from "@/hooks/use-client-request-detail";
import { ClientRequestDetailMobile } from "./client-request-detail-mobile";

export function ClientRequestDetailView() {
  const state = useClientRequestDetail();

  if (state.isDesktop) {
    return null;
  }

  return <ClientRequestDetailMobile {...state} />;
}
