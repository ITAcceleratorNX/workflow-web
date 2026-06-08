"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { DepartmentHeadSmartHomeDesktop } from "./department-head-smart-home-desktop";
import { DepartmentHeadSmartHomeMobile } from "./department-head-smart-home-mobile";

export function DepartmentHeadSmartHomeView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <DepartmentHeadSmartHomeDesktop />;
  return <DepartmentHeadSmartHomeMobile />;
}
