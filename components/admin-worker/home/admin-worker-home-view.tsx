"use client";

import { useAdminWorkerHome } from "@/hooks/use-admin-worker-home";
import { AdminWorkerHomeDesktop } from "./admin-worker-home-desktop";
import { AdminWorkerHomeMobile } from "./admin-worker-home-mobile";

export function AdminWorkerHomeView() {
  const state = useAdminWorkerHome();

  if (state.isDesktop) {
    return <AdminWorkerHomeDesktop />;
  }

  return <AdminWorkerHomeMobile {...state} />;
}
