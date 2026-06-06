"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientSmartHomeMobileView } from "@/components/yandex-smart-home/client-smart-home-mobile-view";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useClientSmartHome } from "@/hooks/use-client-smart-home";

export function ClientSmartHomeView() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const state = useClientSmartHome();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/client");
    }
  }, [isDesktop, router]);

  if (isDesktop) return null;

  return <ClientSmartHomeMobileView {...state} />;
}
