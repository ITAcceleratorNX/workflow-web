"use client";

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
    <div className="flex rounded-xl overflow-hidden bg-[#3D3D3D]">
      {DEPARTMENT_HEAD_REQUEST_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium transition-all duration-200",
            activeTab === tab.key ? "bg-[#5A5A5A] text-white" : "bg-transparent text-gray-400"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
