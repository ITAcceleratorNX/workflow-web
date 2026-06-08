"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { AdminWorkerCompaniesDesktop } from "./admin-worker-companies-desktop";
import { AdminWorkerCompaniesMobile } from "./admin-worker-companies-mobile";

export function AdminWorkerCompaniesView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <AdminWorkerCompaniesDesktop />;
  return <AdminWorkerCompaniesMobile />;
}
