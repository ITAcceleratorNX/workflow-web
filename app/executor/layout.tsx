"use client";

import type { ReactNode } from "react";
import { MobileRoleShell } from "@/components/layout/MobileRoleShell";
import { useRoleGuard } from "@/hooks/use-role-guard";

export default function ExecutorLayout({ children }: { children: ReactNode }) {
  const { ready, isDesktop } = useRoleGuard((role) => role === "executor");

  if (!ready) return null;
  if (isDesktop) return <>{children}</>;
  return <MobileRoleShell>{children}</MobileRoleShell>;
}
