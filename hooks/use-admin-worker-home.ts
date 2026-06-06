"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { getRequestNavigationUrl } from "@/lib/requestNavigation";

export function useAdminWorkerHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const requestId = searchParams.get("requestId");
    if (requestId) {
      const url = getRequestNavigationUrl({
        role: "admin-worker",
        isDesktop,
        requestId,
      });
      if (url) {
        router.replace(url);
        return;
      }
    }

    if (searchParams.get("createRequest") === "true") {
      router.replace("/create-request");
      return;
    }

    if (!isDesktop) return;

    const tab = searchParams.get("tab");
    if (tab === "statistics") {
      router.replace("/admin-worker/statistics");
      return;
    }
    if (tab === "incoming" || tab === "my-requests") {
      router.replace("/admin-worker/requests");
      return;
    }
    if (tab === "change-head") {
      router.replace("/admin-worker/management");
    }
  }, [searchParams, isDesktop, router]);

  const handleRefresh = useCallback(async () => {
    // Static home — nothing to refresh yet.
  }, []);

  return { isDesktop, handleRefresh };
}

export type UseAdminWorkerHomeResult = ReturnType<typeof useAdminWorkerHome>;
