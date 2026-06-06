"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";

/** Legacy route — redirect to client health (7.4e). */
export default function CabinetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const query = searchParams.toString();
    if (isDesktop) {
      router.replace(query ? `/client?${query}` : "/client");
      return;
    }
    router.replace(query ? `/client/health?${query}` : "/client/health");
  }, [isDesktop, router, searchParams]);

  return null;
}
