"use client";

import { useDepartmentHeadRequestDetail } from "@/hooks/use-department-head-request-detail";
import { DepartmentHeadRequestDetailMobile } from "./department-head-request-detail-mobile";

export function DepartmentHeadRequestDetailView() {
  const state = useDepartmentHeadRequestDetail();

  if (state.isDesktop) {
    return null;
  }

  return <DepartmentHeadRequestDetailMobile {...state} />;
}
