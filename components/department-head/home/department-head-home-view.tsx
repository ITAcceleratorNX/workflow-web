"use client";

import { useDepartmentHeadHome } from "@/hooks/use-department-head-home";
import { DepartmentHeadHomeDesktop } from "./department-head-home-desktop";
import { DepartmentHeadHomeMobile } from "./department-head-home-mobile";

export function DepartmentHeadHomeView() {
  const state = useDepartmentHeadHome();

  if (state.isDesktop) {
    return <DepartmentHeadHomeDesktop />;
  }

  return <DepartmentHeadHomeMobile {...state} />;
}
