"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { DepartmentHeadLocationCatalogDesktop } from "./department-head-location-catalog-desktop";
import { DepartmentHeadLocationCatalogMobile } from "./department-head-location-catalog-mobile";

export function DepartmentHeadLocationCatalogView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <DepartmentHeadLocationCatalogDesktop />;
  return <DepartmentHeadLocationCatalogMobile />;
}
