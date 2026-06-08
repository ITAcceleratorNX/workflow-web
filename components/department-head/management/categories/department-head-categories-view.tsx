"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { DepartmentHeadCategoriesDesktop } from "./department-head-categories-desktop";
import { DepartmentHeadCategoriesMobile } from "./department-head-categories-mobile";

export function DepartmentHeadCategoriesView() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <DepartmentHeadCategoriesDesktop />;
  return <DepartmentHeadCategoriesMobile />;
}
