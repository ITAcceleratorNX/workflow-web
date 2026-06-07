"use client";

import {
  MOBILE_REQUESTS_TABS_ROW,
  mobileRequestsTabClass,
} from "@/constants/mobile-requests-ui";
import { cn } from "@/lib/utils";
import {
  ADMIN_WORKER_REQUEST_TABS,
  type AdminWorkerRequestsTab,
} from "./admin-worker-requests-constants";

interface AdminWorkerRequestsTabsProps {
  activeTab: AdminWorkerRequestsTab;
  onTabChange: (tab: AdminWorkerRequestsTab) => void;
  variant?: "mobile" | "desktop";
}

export function AdminWorkerRequestsTabs({
  activeTab,
  onTabChange,
  variant = "mobile",
}: AdminWorkerRequestsTabsProps) {
  if (variant === "desktop") {
    return (
      <>
        {ADMIN_WORKER_REQUEST_TABS.map((tab) => (
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
      {ADMIN_WORKER_REQUEST_TABS.map((tab) => (
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
