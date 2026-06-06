"use client";

import { useIsDesktop } from "@/hooks/use-media-query";

export function useExecutorManagement() {
  const isDesktop = useIsDesktop();

  return { isDesktop };
}

export type UseExecutorManagementResult = ReturnType<typeof useExecutorManagement>;
