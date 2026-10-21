"use client";

import { useRoleRequestDetail } from "@/hooks/use-role-request-detail";
import { ManagerRequestDetailMobile } from "./manager-request-detail-mobile";

export function ManagerRequestDetailView() {
  const state = useRoleRequestDetail("/manager/requests");

  if (state.isDesktop) {
    return null;
  }

  return <ManagerRequestDetailMobile {...state} />;
}
