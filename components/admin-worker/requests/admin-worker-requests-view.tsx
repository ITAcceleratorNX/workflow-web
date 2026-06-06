"use client";

import { useAdminWorkerRequestsList } from "@/hooks/use-admin-worker-requests-list";
import { AdminWorkerRequestsDesktop } from "./admin-worker-requests-desktop";
import { AdminWorkerRequestsMobile } from "./admin-worker-requests-mobile";

export function AdminWorkerRequestsView() {
  const state = useAdminWorkerRequestsList();

  if (state.isDesktop) {
    return <AdminWorkerRequestsDesktop {...state} />;
  }

  return <AdminWorkerRequestsMobile {...state} />;
}
