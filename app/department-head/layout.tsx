"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import { MobileRoleShell } from "@/components/layout/MobileRoleShell";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";

export default function DepartmentHeadLayout({
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

    if (!user || user.role !== "department-head") {
      clearAuth();
      router.push("/login");
    }
  }, [hydrated, user, router, clearAuth]);

  useEffect(() => {
    const isManagement = pathname?.startsWith("/department-head/management");
    const isRequests = pathname?.startsWith("/department-head/requests");
    const isStatistics = pathname?.startsWith("/department-head/statistics");
    if (!isDesktop && (isManagement || isRequests || isStatistics)) {
      document.body.classList.add("admin-management-mobile");
    } else {
      document.body.classList.remove("admin-management-mobile");
    }
    return () => document.body.classList.remove("admin-management-mobile");
  }, [pathname, isDesktop]);

  if (!hydrated || !user) {
    return null;
  }

  if (isDesktop) {
    return (
      <RoleDesktopShell role="department-head">
        {children}
      </RoleDesktopShell>
    );
  }

  return <MobileRoleShell>{children}</MobileRoleShell>;
}
