"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  BOTTOM_NAV_ACTIVE_COLOR,
  BOTTOM_NAV_BAR_BACKGROUND,
  BOTTOM_NAV_INACTIVE_COLOR,
  BOTTOM_NAV_TOP_PAD,
  getActiveTabFromPath,
  getBottomNavBottomPadding,
  getNavItems,
  normalizeActiveTab,
  shouldHideBottomNav,
  type BottomNavTabAlias,
} from "@/lib/bottom-nav";
import { formatRequestActionBadge, requestActionBadgeLabel } from "@/lib/request-action-count";
import { useRequestActionCount } from "@/hooks/use-request-action-count";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingTabUiStore } from "@/stores/booking-tab-ui-store";
import { useBottomNavUiStore } from "@/stores/bottom-nav-ui-store";

interface BottomNavProps {
  activeTab?: BottomNavTabAlias;
  /** @deprecated Use useBottomNavUiStore.setForceHidden in parent layout */
  hidden?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab: activeTabProp,
  hidden = false,
}) => {
  const { role } = useAuthStore();
  const pathname = usePathname();
  const hideBookingForm = useBookingTabUiStore((s) => s.hideBottomNavForBookingForm);
  const storeForceHidden = useBottomNavUiStore((s) => s.forceHidden);
  const requestActionCount = useRequestActionCount();

  if (
    shouldHideBottomNav(pathname, {
      hideBookingForm,
      forceHidden: hidden || storeForceHidden,
    })
  ) {
    return null;
  }

  const navItems = getNavItems(role);
  const activeTab =
    normalizeActiveTab(activeTabProp) ?? getActiveTabFromPath(pathname, role);

  return (
    <nav
      aria-label="Основная навигация"
      className="md:hidden fixed left-0 right-0 bottom-0 z-50 flex flex-row justify-between items-center px-2"
      style={{
        paddingTop: BOTTOM_NAV_TOP_PAD,
        paddingBottom: getBottomNavBottomPadding(),
        backgroundColor: BOTTOM_NAV_BAR_BACKGROUND,
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        const color =
          isActive ? BOTTOM_NAV_ACTIVE_COLOR : BOTTOM_NAV_INACTIVE_COLOR;
        const badge =
          item.key === "requests" ? formatRequestActionBadge(requestActionCount) : null;

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            aria-label={badge ? `${item.label}. ${requestActionBadgeLabel(requestActionCount)}` : undefined}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 min-h-11 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${isActive ? "bg-black/15" : ""}`}
          >
            <span className="relative flex shrink-0">
              <Icon size={24} style={{ color, flexShrink: 0 }} aria-hidden />
              {badge && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-[#B8400E] ring-1 ring-[#B8400E]"
                >
                  {badge}
                </span>
              )}
            </span>
            <span
              className={`text-[11px] text-center leading-[14px] ${isActive ? "font-bold underline underline-offset-2" : "font-medium"}`}
              style={{ color }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
