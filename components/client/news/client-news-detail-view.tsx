"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { ClientNewsDetailDesktopView } from "./client-news-detail-desktop-view";
import { ClientNewsDetailMobileView } from "./client-news-detail-mobile-view";

interface ClientNewsDetailViewProps {
  newsId: string;
}

export function ClientNewsDetailView({ newsId }: ClientNewsDetailViewProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <ClientNewsDetailDesktopView newsId={newsId} />;
  }

  return <ClientNewsDetailMobileView newsId={newsId} />;
}
