"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";

export const ADMIN_WORKER_MANAGEMENT_BACK_HREF = "/admin-worker/management";

/** Desktop: CRUD в ManagerHomeDashboard на `/admin-worker`. */
export function useAdminWorkerManagementCrudPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/admin-worker");
    }
  }, [isDesktop, router]);

  return { isDesktop };
}

export type UseAdminWorkerManagementCrudPageResult = ReturnType<
  typeof useAdminWorkerManagementCrudPage
>;
