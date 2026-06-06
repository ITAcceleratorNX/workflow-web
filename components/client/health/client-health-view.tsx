"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ClientHealthMobileView } from "./client-health-mobile-view";

export function ClientHealthView() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/client");
    }
  }, [isDesktop, router]);

  if (isDesktop) return null;

  return <ClientHealthMobileView />;
}
