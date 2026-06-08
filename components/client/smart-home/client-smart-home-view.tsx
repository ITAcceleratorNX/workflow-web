"use client";

import { ClientSmartHomeDesktopView } from "@/components/client/smart-home/client-smart-home-desktop-view";
import { ClientSmartHomeMobileView } from "@/components/yandex-smart-home/client-smart-home-mobile-view";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useClientSmartHome } from "@/hooks/use-client-smart-home";

export function ClientSmartHomeView() {
  const isDesktop = useIsDesktop();
  const state = useClientSmartHome();

  if (isDesktop) {
    return <ClientSmartHomeDesktopView {...state} />;
  }

  return <ClientSmartHomeMobileView {...state} />;
}
