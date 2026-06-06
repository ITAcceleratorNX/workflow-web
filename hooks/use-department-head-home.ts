"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { getRequestNavigationUrl } from "@/lib/requestNavigation";

export function useDepartmentHeadHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const requestId = searchParams.get("requestId");
    if (requestId) {
      const url = getRequestNavigationUrl({
        role: "department-head",
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
      router.replace("/department-head/statistics");
      return;
    }
    if (tab === "incoming" || tab === "my-requests" || tab === "recurring-tasks") {
      router.replace("/department-head/requests");
      return;
    }
    if (tab === "meeting-rooms") {
      router.replace("/department-head/booking");
      return;
    }
    if (tab === "management") {
      router.replace("/department-head/management");
    }
  }, [searchParams, isDesktop, router]);

  const handleRefresh = useCallback(async () => {
    // Static home — nothing to refresh yet.
  }, []);

  return { isDesktop, handleRefresh };
}

export type UseDepartmentHeadHomeResult = ReturnType<typeof useDepartmentHeadHome>;
