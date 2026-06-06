"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useClientTasksPage } from "@/hooks/use-client-tasks-page";
import { ClientTasksMobileView } from "./client-tasks-mobile-view";

export function ClientTasksView() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const state = useClientTasksPage();

  useEffect(() => {
    if (isDesktop) {
      router.replace("/client");
    }
  }, [isDesktop, router]);

  if (isDesktop) return null;

  return <ClientTasksMobileView {...state} />;
}
