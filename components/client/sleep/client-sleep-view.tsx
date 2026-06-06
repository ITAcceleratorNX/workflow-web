"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ClientSleepMobileView } from "./client-sleep-mobile-view";

export function ClientSleepView() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/client");
    }
  }, [isDesktop, router]);

  if (isDesktop) return null;

  return <ClientSleepMobileView />;
}
