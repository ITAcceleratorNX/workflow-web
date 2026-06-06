"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useClientNewsPage } from "@/hooks/use-client-news-page";
import { ClientNewsMobileView } from "./client-news-mobile-view";

export function ClientNewsView() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const state = useClientNewsPage();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/client");
    }
  }, [isDesktop, router]);

  if (isDesktop) return null;

  return <ClientNewsMobileView {...state} />;
}
