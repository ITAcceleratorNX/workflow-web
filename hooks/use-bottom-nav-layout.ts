"use client";

import { usePathname } from "next/navigation";
import {
  getBottomNavPadding,
  getBottomNavPaddingOrZero,
  shouldHideBottomNav,
} from "@/lib/bottom-nav";
import { useBookingTabUiStore } from "@/stores/booking-tab-ui-store";
import { useBottomNavUiStore } from "@/stores/bottom-nav-ui-store";

export function useBottomNavLayout(forceHidden = false) {
  const pathname = usePathname();
  const hideBookingForm = useBookingTabUiStore((s) => s.hideBottomNavForBookingForm);
  const storeForceHidden = useBottomNavUiStore((s) => s.forceHidden);

  const hidden = shouldHideBottomNav(pathname, {
    hideBookingForm,
    forceHidden: forceHidden || storeForceHidden,
  });

  return {
    hidden,
    showNav: !hidden,
    paddingBottom: hidden
      ? undefined
      : getBottomNavPaddingOrZero(pathname, {
          hideBookingForm,
          forceHidden: forceHidden || storeForceHidden,
        }) ?? getBottomNavPadding(),
  };
}
