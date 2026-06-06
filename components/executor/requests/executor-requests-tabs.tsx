"use client";

import { cn } from "@/lib/utils";
import {
  EXECUTOR_REQUEST_TABS,
  type ExecutorRequestsTab,
} from "./executor-requests-constants";

interface ExecutorRequestsTabsProps {
  activeTab: ExecutorRequestsTab;
  onTabChange: (tab: ExecutorRequestsTab) => void;
  variant?: "mobile" | "desktop";
}

export function ExecutorRequestsTabs({
  activeTab,
  onTabChange,
  variant = "mobile",
}: ExecutorRequestsTabsProps) {
  if (variant === "desktop") {
    return (
      <>
        {EXECUTOR_REQUEST_TABS.map((tab) => (
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
      {EXECUTOR_REQUEST_TABS.map((tab) => (
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
