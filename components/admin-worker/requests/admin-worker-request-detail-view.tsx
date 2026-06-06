"use client";

import { useAdminWorkerRequestDetail } from "@/hooks/use-admin-worker-request-detail";
import { AdminWorkerRequestDetailMobile } from "./admin-worker-request-detail-mobile";

export function AdminWorkerRequestDetailView() {
  const state = useAdminWorkerRequestDetail();

  if (state.isDesktop) {
    return null;
  }

  return <AdminWorkerRequestDetailMobile {...state} />;
}
