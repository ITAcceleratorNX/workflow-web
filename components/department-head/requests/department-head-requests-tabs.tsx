"use client";

import { RequestsTabs } from "@/components/requests/requests-tabs";
import {
  DEPARTMENT_HEAD_REQUEST_TABS,
  type DepartmentHeadRequestsTab,
} from "./department-head-requests-constants";

interface DepartmentHeadRequestsTabsProps {
  activeTab: DepartmentHeadRequestsTab;
  onTabChange: (tab: DepartmentHeadRequestsTab) => void;
  variant?: "mobile" | "desktop";
}

export function DepartmentHeadRequestsTabs(props: DepartmentHeadRequestsTabsProps) {
  return <RequestsTabs tabs={DEPARTMENT_HEAD_REQUEST_TABS} {...props} />;
}
