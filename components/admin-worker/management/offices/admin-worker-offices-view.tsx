"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { AdminWorkerOfficesDesktop } from "./admin-worker-offices-desktop";
import { AdminWorkerOfficesMobile } from "./admin-worker-offices-mobile";

interface AdminWorkerOfficesViewProps {
  title?: string;
}

export function AdminWorkerOfficesView({ title = "Офисы" }: AdminWorkerOfficesViewProps) {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <AdminWorkerOfficesDesktop title={title} />;
  return <AdminWorkerOfficesMobile title={title} />;
}
