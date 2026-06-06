"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";

/** Legacy route: desktop → dashboard, mobile → shared /profile. */
export function useAdminWorkerAccount() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/admin-worker");
    } else {
      router.replace("/profile");
    }
  }, [isDesktop, router]);
}
