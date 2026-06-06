"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ClientNewsDetailMobileView } from "./client-news-detail-mobile-view";

interface ClientNewsDetailViewProps {
  newsId: string;
}

export function ClientNewsDetailView({ newsId }: ClientNewsDetailViewProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/client");
    }
  }, [isDesktop, router]);

  if (isDesktop) return null;

  return <ClientNewsDetailMobileView newsId={newsId} />;
}
