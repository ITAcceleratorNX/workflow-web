"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isClientSharedStackPath } from "@/lib/client-shared-stack";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ClientDesktopShell } from "@/components/layout/ClientDesktopShell";
import { MobileRoleShell } from "@/components/layout/MobileRoleShell";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const isDesktop = useIsDesktop();
  const [hydrated, setHydrated] = useState(false);
  const isSharedStack = isClientSharedStackPath(pathname);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      clearAuth();
      router.push("/login");
      return;
    }

    if (!isSharedStack && user.role !== "client") {
      clearAuth();
      router.push("/login");
      return;
    }
  }, [hydrated, user, router, clearAuth, isSharedStack]);

  if (!hydrated || !user) {
    return null;
  }

  if (isDesktop) {
    return <ClientDesktopShell>{children}</ClientDesktopShell>;
  }

  return <MobileRoleShell>{children}</MobileRoleShell>;
}
