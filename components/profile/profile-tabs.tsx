"use client";

import { cn } from "@/lib/utils";
import { ROLES_WITH_LOGS, type ProfileTab } from "@/constants/profile";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  role?: string | null;
}

const BASE_TABS: { key: ProfileTab; label: string }[] = [{ key: "profile", label: "Профиль" }];

/** Mobile profile tabs — parity с workflow-mobile ProfileTabs. */
export function ProfileTabs({ activeTab, onTabChange, role }: ProfileTabsProps) {
  const showLogs = role && ROLES_WITH_LOGS.includes(role as (typeof ROLES_WITH_LOGS)[number]);
  const tabs = showLogs ? [...BASE_TABS, { key: "logs" as const, label: "Логи" }] : BASE_TABS;

  if (tabs.length <= 1) return null;

  return (
    <div className="rounded-xl border border-[#3A3A3C] p-1">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "flex-1 py-2.5 px-2.5 rounded-lg text-[13px] font-medium transition-colors",
              activeTab === tab.key
                ? "bg-[#3A3A3C] text-white"
                : "text-[#8E8E93] hover:text-white/80",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
