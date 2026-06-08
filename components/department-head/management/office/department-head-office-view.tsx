"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { DepartmentHeadOfficeDesktop } from "./department-head-office-desktop";
import { DepartmentHeadOfficeMobile } from "./department-head-office-mobile";

export function DepartmentHeadOfficeView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <DepartmentHeadOfficeDesktop />;
  return <DepartmentHeadOfficeMobile />;
}
