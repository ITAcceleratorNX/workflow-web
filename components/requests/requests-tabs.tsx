"use client";

import {
  MOBILE_REQUESTS_TABS_ROW,
  mobileRequestsTabClass,
} from "@/constants/mobile-requests-ui";
import { cn } from "@/lib/utils";

interface RequestsTabsProps<T extends string> {
  tabs: { key: T; label: string }[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  variant?: "mobile" | "desktop";
}

/** Вкладки раздела «Заявки» (Администратор, Руководитель). */
export function RequestsTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  variant = "mobile",
}: RequestsTabsProps<T>) {
  if (variant === "desktop") {
    return (
      <>
        {tabs.map((tab) => (
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
      {tabs.map((tab) => (
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
