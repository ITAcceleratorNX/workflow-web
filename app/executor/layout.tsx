"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import { BottomNav } from "@/components/BottomNav";

export default function ExecutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const isDesktop = useIsDesktop();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!user || user.role !== "executor") {
      clearAuth();
      router.push("/login");
    }
  }, [hydrated, user, router, clearAuth]);

  if (!hydrated || !user) {
    return null;
  }

  const isRequestsPage = pathname?.startsWith("/executor/requests");
  return (
    <div
      className={
        !isDesktop && isRequestsPage
          ? "min-h-screen pb-[calc(110px+env(safe-area-inset-bottom,0px))] bg-[#1C1C1E]"
          : ""
      }
    >
      {children}
      {!isDesktop && isRequestsPage && <BottomNav />}
    </div>
  );
}
