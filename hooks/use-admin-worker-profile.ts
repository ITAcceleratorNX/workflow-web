"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";

export function useAdminWorkerProfile() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      router.replace("/profile");
    }
  }, [router]);

  return { isDesktop };
}

export type UseAdminWorkerProfileResult = ReturnType<typeof useAdminWorkerProfile>;
