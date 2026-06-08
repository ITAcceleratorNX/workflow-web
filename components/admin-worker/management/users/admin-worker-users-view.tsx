"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { AdminWorkerUsersDesktop } from "./admin-worker-users-desktop";
import { AdminWorkerUsersMobile } from "./admin-worker-users-mobile";

export function AdminWorkerUsersView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <AdminWorkerUsersDesktop />;
  return <AdminWorkerUsersMobile />;
}
