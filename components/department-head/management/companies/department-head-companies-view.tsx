"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { DepartmentHeadCompaniesDesktop } from "./department-head-companies-desktop";
import { DepartmentHeadCompaniesMobile } from "./department-head-companies-mobile";

export function DepartmentHeadCompaniesView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <DepartmentHeadCompaniesDesktop />;
  return <DepartmentHeadCompaniesMobile />;
}
