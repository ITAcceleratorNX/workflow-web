"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { DepartmentHeadUsersDesktop } from "./department-head-users-desktop";
import { DepartmentHeadUsersMobile } from "./department-head-users-mobile";

export function DepartmentHeadUsersView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <DepartmentHeadUsersDesktop />;
  return <DepartmentHeadUsersMobile />;
}
