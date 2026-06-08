"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { useClientNewsPage } from "@/hooks/use-client-news-page";
import { ClientNewsDesktopView } from "./client-news-desktop-view";
import { ClientNewsMobileView } from "./client-news-mobile-view";

export function ClientNewsView() {
  const isDesktop = useIsDesktop();
  const state = useClientNewsPage();

  if (isDesktop) {
    return <ClientNewsDesktopView {...state} />;
  }

  return <ClientNewsMobileView {...state} />;
}
