"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MobileRoleShell } from "@/components/layout/MobileRoleShell";
import { RoleDesktopShell } from "@/components/layout/RoleDesktopShell";
import { useBodyClass } from "@/hooks/use-body-class";
import { useRoleGuard } from "@/hooks/use-role-guard";

const MOBILE_THEMED_SECTIONS = ["management", "requests", "statistics"];

/** Раскладка разделов Администратора и Офис-менеджера: проверка роли, оболочка desktop/mobile. */
export function StaffRoleLayout({
  role,
  children,
}: {
  role: "admin-worker" | "department-head";
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { ready, isDesktop } = useRoleGuard((userRole) => userRole === role);
  const inThemedSection = MOBILE_THEMED_SECTIONS.some((section) => pathname?.startsWith(`/${role}/${section}`));
  useBodyClass("admin-management-mobile", !isDesktop && inThemedSection);

  if (!ready) return null;
  if (isDesktop) return <RoleDesktopShell role={role}>{children}</RoleDesktopShell>;
  return <MobileRoleShell>{children}</MobileRoleShell>;
}
