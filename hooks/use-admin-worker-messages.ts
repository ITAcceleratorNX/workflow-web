"use client";

import { useIsDesktop } from "@/hooks/use-media-query";

export function useAdminWorkerMessages() {
  const isDesktop = useIsDesktop();

  return { isDesktop };
}

export type UseAdminWorkerMessagesResult = ReturnType<typeof useAdminWorkerMessages>;
