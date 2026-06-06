"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop, useMediaQuery } from "@/hooks/use-media-query";

export function useManagerCabinet() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const isLargeDesktop = useMediaQuery("(min-width: 1200px)");

  useEffect(() => {
    if (isLargeDesktop) {
      router.replace("/manager");
    }
  }, [isLargeDesktop, router]);

  return { isDesktop };
}

export type UseManagerCabinetResult = ReturnType<typeof useManagerCabinet>;
