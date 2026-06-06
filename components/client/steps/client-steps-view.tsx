"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ClientStepsMobileView } from "./client-steps-mobile-view";

export function ClientStepsView() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/client");
    }
  }, [isDesktop, router]);

  if (isDesktop) return null;

  return <ClientStepsMobileView />;
}
