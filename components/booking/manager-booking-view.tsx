"use client";

import { useIsDesktop } from "@/hooks/use-media-query";
import { BottomNav } from "@/components/BottomNav";
import { RoleBookingTabsView } from "./role-booking-tabs-view";

/** Manager booking — layout не даёт BottomNav на /manager/booking. */
export function ManagerBookingView() {
  const isDesktop = useIsDesktop();

  return (
    <>
      <RoleBookingTabsView />
      {!isDesktop && <BottomNav activeTab="booking" />}
    </>
  );
}
