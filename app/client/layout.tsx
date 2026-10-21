"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { isClientSharedStackPath } from "@/lib/client-shared-stack";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { ClientDesktopShell } from "@/components/layout/ClientDesktopShell";
import { ExecutorDesktopShell } from "@/components/layout/ExecutorDesktopShell";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";
import { isAdminManagerRole } from "@/constants/roles";
import { MobileRoleShell } from "@/components/layout/MobileRoleShell";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSharedStack = isClientSharedStackPath(pathname);
  // Общие экраны (задачи, статистика) открываются и другим ролям; остальное — только Клиенту.
  const { ready, user, isDesktop } = useRoleGuard((role) => isSharedStack || role === "client");

  if (!ready || !user) {
    return null;
  }

  if (isDesktop) {
    // Общие экраны (задачи, статистика) открываются в оболочке своей роли, а не клиента.
    if (isSharedStack && isAdminManagerRole(user.role)) {
      return <RoleDesktopShell role={user.role}>{children}</RoleDesktopShell>;
    }
    if (isSharedStack && user.role === "executor") {
      return <ExecutorDesktopShell>{children}</ExecutorDesktopShell>;
    }
    return <ClientDesktopShell>{children}</ClientDesktopShell>;
  }

  return <MobileRoleShell>{children}</MobileRoleShell>;
}
