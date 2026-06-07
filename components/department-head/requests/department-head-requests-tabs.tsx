"use client";

import {
  MOBILE_REQUESTS_TABS_ROW,
  mobileRequestsTabClass,
} from "@/constants/mobile-requests-ui";
import { cn } from "@/lib/utils";
import {
  DEPARTMENT_HEAD_REQUEST_TABS,
  type DepartmentHeadRequestsTab,
} from "./department-head-requests-constants";

interface DepartmentHeadRequestsTabsProps {
  activeTab: DepartmentHeadRequestsTab;
  onTabChange: (tab: DepartmentHeadRequestsTab) => void;
  variant?: "mobile" | "desktop";
}

export function DepartmentHeadRequestsTabs({
  activeTab,
  onTabChange,
  variant = "mobile",
}: DepartmentHeadRequestsTabsProps) {
  if (variant === "desktop") {
    return (
      <>
        {DEPARTMENT_HEAD_REQUEST_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-[#E85D2B] text-white"
                : "text-white/70 hover:bg-white/10"
            )}
          >
            {tab.label}
          </button>
        ))}
      </>
    );
  }

  return (
    <div className={MOBILE_REQUESTS_TABS_ROW}>
      {DEPARTMENT_HEAD_REQUEST_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={mobileRequestsTabClass(activeTab === tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
