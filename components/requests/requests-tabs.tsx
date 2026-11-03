"use client";

import {
  MOBILE_REQUESTS_TABS_ROW,
  mobileRequestsTabClass,
} from "@/constants/mobile-requests-ui";
import { RQ_DESKTOP_TABS, rqDesktopTabClass } from "@/constants/requests-desktop-ui";

interface RequestsTabsProps<T extends string> {
  tabs: readonly { key: T; label: string }[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  variant?: "mobile" | "desktop";
}

/** Вкладки раздела «Заявки» всех ролей; на десктопе — сегменты в общей плашке. */
export function RequestsTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  variant = "mobile",
}: RequestsTabsProps<T>) {
  if (variant === "desktop") {
    // aria-pressed, а не role="tab": легаси-правила [role="tab"] перекрашивают вкладки на тёмных страницах.
    return (
      <div className={RQ_DESKTOP_TABS} aria-label="Разделы заявок">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={activeTab === tab.key}
            onClick={() => onTabChange(tab.key)}
            className={rqDesktopTabClass(activeTab === tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
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
