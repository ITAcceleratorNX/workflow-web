"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { RoleBookingTabsView } from "./role-booking-tabs-view";

/** Manager booking — BottomNav в manager layout. */
export function ManagerBookingView() {
  return <RoleBookingTabsView />;
}
