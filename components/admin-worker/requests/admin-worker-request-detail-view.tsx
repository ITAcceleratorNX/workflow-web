"use client";

import { useRoleRequestDetail } from "@/hooks/use-role-request-detail";
import { AdminWorkerRequestDetailMobile } from "./admin-worker-request-detail-mobile";

export function AdminWorkerRequestDetailView() {
  const state = useRoleRequestDetail("/admin-worker/requests");

  if (state.isDesktop) {
    return null;
  }

  return <AdminWorkerRequestDetailMobile {...state} />;
}
