"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useBodyClass } from "@/hooks/use-body-class";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";
import { MobileRoleShell } from "@/components/layout/MobileRoleShell";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, user, isDesktop, hydrated } = useRoleGuard((role) => role === "manager");
  useBodyClass("manager-mobile", !isDesktop && (pathname === "/manager" || pathname === "/manager/statistics"));

  useEffect(() => {
    if (!hydrated || user?.role !== "manager") return;

    const t = setTimeout(() => {
      if (typeof window === "undefined") return;
      const currentSearch = new URLSearchParams(window.location.search);
      const hasTab = currentSearch.get("tab");
      const hasRequestId = currentSearch.get("requestId");
      const hasParams = !!hasTab || !!hasRequestId;

      // Мобильная главная — хаб «Управление»; на десктопе «Мой кабинет» рисует сама /manager.
      if (pathname === "/manager" && !hasParams && !isDesktop) {
        router.replace("/manager/cabinet");
      }
    }, 0);
    return () => clearTimeout(t);
  }, [hydrated, user?.role, router, isDesktop, pathname]);

  if (!ready) {
    return null;
  }

  if (isDesktop) {
    return (
      <RoleDesktopShell role="manager">
        {children}
      </RoleDesktopShell>
    );
  }

  return <MobileRoleShell>{children}</MobileRoleShell>;
}
