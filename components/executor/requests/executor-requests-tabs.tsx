"use client";

import {
  MOBILE_REQUESTS_TABS_ROW,
  mobileRequestsTabClass,
} from "@/constants/mobile-requests-ui";
import { RequestsTabs } from "@/components/requests/requests-tabs";
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
    return <RequestsTabs variant="desktop" tabs={EXECUTOR_REQUEST_TABS} activeTab={activeTab} onTabChange={onTabChange} />;
  }

  return (
    <div className={cn(MOBILE_REQUESTS_TABS_ROW, "flex-nowrap overflow-x-auto")} aria-label="Разделы заявок">
      {EXECUTOR_REQUEST_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          aria-pressed={activeTab === tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(mobileRequestsTabClass(activeTab === tab.key), "shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
